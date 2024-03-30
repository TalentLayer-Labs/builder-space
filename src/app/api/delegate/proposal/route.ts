import { recoverMessageAddress } from 'viem';
import { getConfig } from '../../../../config';
import {
  getDelegationSigner,
  getPublicClient,
  isPlatformAllowedToDelegate,
} from '../../../utils/delegate';
import TalentLayerService from '../../../../contracts/ABI/TalentLayerService.json';
import { getProposalSignature } from '../../../../utils/signature';
import { getPlatformPostingFees } from '../../../../queries/platform';
import {
  getUserByAddress,
  getUserByTalentLayerId,
} from '../../../../modules/BuilderPlace/actions/user';
import { ERROR_EMAIL_NOT_VERIFIED } from '../../../../modules/BuilderPlace/apiResponses';
import {
  checkOrResetTransactionCounter,
  incrementWeeklyTransactionCounter,
} from '../../../utils/email';

export interface ICreateProposal {
  chainId: number;
  userId: string;
  userAddress: string;
  serviceId: string;
  rateToken: string;
  rateAmount: string;
  expirationDate: string;
  cid: string;
  platformId: string;
  signature: `0x${string}` | Uint8Array;
}

/**
 * POST /api/delegate/proposal
 */
export async function POST(req: Request) {
  console.log('POST');
  const body: ICreateProposal = await req.json();
  console.log('json', body);
  const {
    chainId,
    userId,
    userAddress,
    cid,
    platformId,
    rateAmount,
    rateToken,
    expirationDate,
    serviceId,
    signature,
  } = body;

  const config = getConfig(chainId);

  if (process.env.NEXT_PUBLIC_ACTIVATE_DELEGATE !== 'true') {
    return Response.json({ message: 'Delegation is not activated' }, { status: 500 });
  }

  const signatureAddress = await recoverMessageAddress({
    message: `connect with ${userAddress}`,
    signature: signature,
  });

  const user = await getUserByAddress(signatureAddress);

  if (user?.talentLayerId !== userId) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const user = await getUserByTalentLayerId(userId);

    if (user) {
      if (!user.isEmailVerified) {
        console.log('Email not verified');
        return Response.json({ error: ERROR_EMAIL_NOT_VERIFIED }, { status: 401 });
      }

      await checkOrResetTransactionCounter(user);
      const canDelegate = await isPlatformAllowedToDelegate(chainId, userAddress);

      if (!canDelegate) {
        Response.json({ error: 'Delegation is Not activated for this address' }, { status: 401 });
      }

      const walletClient = await getDelegationSigner();
      if (!walletClient) {
        console.log('Wallet client not found');
        return Response.json({ error: 'Server Error' }, { status: 500 });
      }

      const publicClient = getPublicClient();
      if (!publicClient) {
        console.log('Public client not found');
        return Response.json({ error: 'Server Error' }, { status: 500 });
      }

      let transaction;

      //TODO: V2 - RPC call instead ?
      const platformFeesResponse = await getPlatformPostingFees(chainId, platformId);
      let proposalPostingFee = platformFeesResponse?.data?.data?.platform.proposalPostingFee;
      proposalPostingFee = BigInt(Number(proposalPostingFee) || '0');

      const signature = await getProposalSignature({
        profileId: Number(userId),
        serviceId: Number(serviceId),
        cid: cid,
      });

      console.log('Creating proposal with args', userId, platformId, cid, signature);
      transaction = await walletClient.writeContract({
        address: config.contracts.serviceRegistry,
        abi: TalentLayerService.abi,
        functionName: 'createProposal',
        args: [
          userId,
          serviceId,
          rateToken,
          rateAmount,
          platformId,
          cid,
          expirationDate,
          signature,
        ],
        value: proposalPostingFee,
      });

      await incrementWeeklyTransactionCounter(user);

      return Response.json({ transaction: transaction }, { status: 201 });
    }
  } catch (error: any) {
    let message = 'Failed to create proposal';
    return Response.json({ message, error }, { status: 500 });
  }
}
