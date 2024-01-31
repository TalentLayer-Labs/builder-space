import { getAcceptedProposals } from '../../../queries/proposals';
import { IProposal, NotificationApiUri, NotificationType } from '../../../types';
import { NextApiRequest, NextApiResponse } from 'next';
import { sendMailToAddresses } from '../../../scripts/iexec/sendMailToAddresses';
import { getUsersWeb3MailPreference } from '../../../queries/users';
import { calculateCronData } from '../../../modules/Web3mail/utils/cron';
import {
  getDomain,
  hasEmailBeenSent,
  persistCronProbe,
} from '../../../modules/Web3mail/utils/database';
import { EmptyError, getValidUsers, prepareCronApi } from '../utils/mail';
import { renderMail } from '../utils/generateWeb3Mail';
import { renderTokenAmount } from '../../../utils/conversion';
import { EmailType } from '.prisma/client';
import { generateMailProviders } from '../utils/mailProvidersSingleton';

export const config = {
  maxDuration: 300, // 5 minutes.
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const chainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID as string;
  const platformId = process.env.NEXT_PUBLIC_PLATFORM_ID as string;
  const databaseUrl = process.env.DATABASE_URL as string;
  const cronSecurityKey = req.headers.authorization as string;
  const privateKey = process.env.NEXT_WEB3MAIL_PLATFORM_PRIVATE_KEY as string;
  const isWeb3mailActive = process.env.NEXT_PUBLIC_ACTIVATE_WEB3MAIL as string;
  const isWeb2mailActive = process.env.NEXT_PUBLIC_ACTIVATE_MAIL_NOTIFICATIONS as string;
  const RETRY_FACTOR = process.env.NEXT_WEB3MAIL_RETRY_FACTOR
    ? process.env.NEXT_WEB3MAIL_RETRY_FACTOR
    : '0';

  let sentEmails = 0,
    nonSentEmails = 0;

  const notificationType = prepareCronApi(
    isWeb3mailActive,
    isWeb2mailActive,
    chainId,
    platformId,
    databaseUrl,
    cronSecurityKey,
    privateKey,
    res,
  );

  // Check whether the user provided a timestamp or if it will come from the cron config
  const { sinceTimestamp, cronDuration } = calculateCronData(
    req,
    Number(RETRY_FACTOR),
    NotificationApiUri.ProposalValidated,
  );

  let status = 200;
  try {
    const response = await getAcceptedProposals(Number(chainId), platformId, sinceTimestamp);

    if (!response?.data?.data?.proposals || response.data.data.proposals.length === 0) {
      throw new EmptyError(`No new proposals validated available`);
    }

    const proposals: IProposal[] = response.data.data.proposals;
    const nonSentProposalEmails: IProposal[] = [];

    // Check if a notification email has already been sent for these proposals
    if (proposals.length > 0) {
      for (const proposal of proposals) {
        const hasBeenSent = await hasEmailBeenSent(proposal.id, EmailType.PROPOSAL_VALIDATED);
        if (!hasBeenSent) {
          nonSentProposalEmails.push(proposal);
        }
      }
    }

    // If some emails have not been sent yet, send a web3mail & persist in the DB that the email was sent
    if (nonSentProposalEmails.length == 0) {
      throw new EmptyError(`All new proposals notifications already sent`);
    }
    // Filter out users which have not opted for the feature
    const allSellerAddresses = nonSentProposalEmails.map(proposal => proposal.seller.address);
    const notificationResponse = await getUsersWeb3MailPreference(
      Number(chainId),
      allSellerAddresses,
      'activeOnProposalValidated',
    );

    if (
      !notificationResponse?.data?.data?.userDescriptions ||
      notificationResponse.data.data.userDescriptions.length === 0
    ) {
      throw new EmptyError(`No User opted for this feature`);
    }

    const validUserAddresses = getValidUsers(notificationResponse.data.data.userDescriptions);

    const proposalEmailsToBeSent = nonSentProposalEmails.filter(proposal =>
      validUserAddresses.includes(proposal.seller.address),
    );

    if (proposalEmailsToBeSent.length === 0) {
      throw new EmptyError(
        `New proposals validated detected, but no concerned users opted for the ${EmailType.PROPOSAL_VALIDATED} feature`,
      );
    }

    const providers = generateMailProviders(notificationType as NotificationType, privateKey);

    for (const proposal of proposalEmailsToBeSent) {
      const domain = await getDomain(proposal.service.buyer.id);

      try {
        const email = renderMail(
          `Your proposal got accepted!`,
          `The proposal you made for the open-source mission "${
            proposal.service.description?.title
          }" you posted on BuilderPlace got accepted by ${proposal.service.buyer.handle} !
              The following amount was agreed: ${renderTokenAmount(
                proposal.rateToken,
                proposal.rateAmount,
              )}. 
              For the following work to be provided: ${proposal.description?.about}.`,
          domain,
          proposal.seller.handle,
          `${domain}/work/${proposal.service.id}`,
          `Go to proposal detail`,
        );
        // @dev: This function needs to be throwable to avoid persisting the proposal in the DB if the email is not sent
        await sendMailToAddresses(
          `Your proposal got accepted !`,
          email,
          [proposal.seller.address],
          proposal.service.platform.name,
          providers,
          notificationType as NotificationType,
          EmailType.PROPOSAL_VALIDATED,
          proposal.id,
        );
        console.log('Notification recorded in Database');
        sentEmails++;
      } catch (e: any) {
        nonSentEmails++;
        console.error(e.message);
      }
    }
  } catch (e: any) {
    if (e instanceof EmptyError) {
      console.warn(e.message);
    } else {
      console.error(e.message);
      status = 500;
    }
  } finally {
    if (!req.query.sinceTimestamp) {
      // Update cron probe in db
      await persistCronProbe(EmailType.PROPOSAL_VALIDATED, sentEmails, nonSentEmails, cronDuration);
      console.log(
        `Cron probe updated in DB for ${EmailType.PROPOSAL_VALIDATED}: duration: ${cronDuration}, sentEmails: ${sentEmails}, nonSentEmails: ${nonSentEmails}`,
      );
    }
    console.log(
      `Web3 Emails sent - ${sentEmails} email successfully sent | ${nonSentEmails} non sent emails`,
    );
  }
  return res
    .status(status)
    .json(
      `Web3 Emails sent - ${sentEmails} email successfully sent | ${nonSentEmails} non sent emails`,
    );
}
