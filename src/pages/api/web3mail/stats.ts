import { NextApiRequest, NextApiResponse } from 'next';
import {
  getCronProbeCount,
  getWeb3mailCount,
  getWeb3mailCountByMonth,
} from '../../../modules/Web3mail/utils/database';
import { Web3MailStats } from '../../../types';
import { generateWeb3mailProviders } from '../utils/mail';
import { Contact } from '@iexec/web3mail';

export const config = {
  maxDuration: 300, // 5 minutes.
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const chainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID as string;
  const privateKey = process.env.NEXT_WEB3MAIL_PLATFORM_PRIVATE_KEY as string;
  const isWeb3mailActive = process.env.NEXT_PUBLIC_ACTIVATE_WEB3MAIL as string;

  if (isWeb3mailActive !== 'true') {
    return res.status(500).json({ message: 'Web3mail not activated' });
  }

  if (!chainId) {
    return res.status(500).json('Chain Id is not set');
  }

  if (!privateKey) {
    return res.status(500).json('Private key is not set');
  }

  const databaseUrl = process.env.DATABASE_URL as string;

  if (!databaseUrl) {
    return res.status(500).json('database Url is not set');
  }

  const stats: Web3MailStats = {
    totalSent: 0,
    totalSentByMonth: [],
    totalSentThisMonth: 0,
    totalContact: 0,
    totalCronRunning: 0,
  };

  try {
    stats.totalSent = await getWeb3mailCount();
    stats.totalCronRunning = await getCronProbeCount();
    stats.totalSentByMonth = await getWeb3mailCountByMonth();
    stats.totalSentThisMonth = stats.totalSentByMonth[new Date().getMonth()] || 0;

    const { web3mail } = generateWeb3mailProviders(privateKey);
    const contactList: Contact[] = await web3mail.fetchMyContacts();
    stats.totalContact = contactList.length;

    return res.status(200).json({ message: `Successfully fetched email stats`, data: stats });
  } catch (e: any) {
    console.error(e.message);
    return res.status(500).json(`Error while fetching email stats - ${e.message}`);
  }
}
