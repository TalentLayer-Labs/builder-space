import { recoverMessageAddress } from 'viem';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import TalentLayerPlatformID from '../../../../contracts/ABI/TalentLayerPlatformID.json';
import { getConfig } from '../../../../config';
import {
  getDelegationSigner,
  getPublicClient,
  isPlatformAllowedToDelegate,
} from '../../utils/delegate';

export interface IPlatformMintForAddress {
  platformName: string;
  address: string;
  chainId: number;
  signature: `0x${string}` | Uint8Array;
}

/**
 * POST /api/delegate/platform
 * @note: The delegate address executing the mint function needs to have the MINT_ROLE
 */
export async function POST(req: Request) {
  console.log('POST');
  const body: IPlatformMintForAddress = await req.json();
  console.log('json', body);
  const config = getConfig(body.chainId);

  // @TODO: move it to a middleware and apply to all POST and PUT ?
  const signatureAddress = await recoverMessageAddress({
    message: `connect with ${body.address}`,
    signature: body.signature,
  });

  const canDelegate = await isPlatformAllowedToDelegate(body.chainId, body.address);

  if (!canDelegate) {
    return Response.json(
      { error: 'Delegation is Not activated for this address' },
      { status: 401 },
    );
  }

  if (signatureAddress !== body.address) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_ACTIVATE_DELEGATE_MINT !== 'true') {
    return Response.json({ error: 'Delegation is not activated' }, { status: 401 });
  }

  try {
    const publicClient = getPublicClient();
    if (!publicClient) {
      return;
    }

    const walletClient = await getDelegationSigner();
    if (!walletClient) {
      return;
    }

    const mintFee = await publicClient.readContract({
      address: config.contracts.talentLayerPlatformId,
      abi: TalentLayerPlatformID.abi,
      functionName: 'mintFee',
    });

    console.log('MintFee', mintFee);

    const transaction = await walletClient.writeContract({
      address: config.contracts.talentLayerPlatformId,
      abi: TalentLayerPlatformID.abi,
      functionName: 'mintForAddress',
      args: [body.platformName, body.address],
      value: mintFee as bigint,
    });

    return Response.json({ id: transaction }, { status: 201 });
  } catch (error: any) {
    // @TODO: move error handle to a middleware ? or factorize it ?
    let message = 'Failed to create plaform';
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string)[0] || 'data';
        message = `A platform already exists with this ${target}`;
      }
    }

    return Response.json({ message, error }, { status: 500 });
  }
}
