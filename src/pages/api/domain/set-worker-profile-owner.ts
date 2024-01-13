import { NextApiRequest, NextApiResponse } from 'next';
import {
  getUserByAddress,
  getUserById,
  removeAddressFromUser,
  setUserOwner,
} from '../../../modules/BuilderPlace/actions';
import { SetUserProfileOwner } from '../../../modules/BuilderPlace/types';
import { EntityStatus } from '.prisma/client';
import { getUserByAddress as getTalentLayerUserByAddress } from '../../../queries/users';
import {
  ALREADY_HAVE_PROFILE,
  PROFILE_ALREADY_HAS_OWNER,
  PROFILE_DOES_NOT_EXIST,
} from '../../../modules/BuilderPlace/apiResponses';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const body: SetUserProfileOwner = req.body;
    console.log('Received data:', body);

    if (!body.id || !body.talentLayerId) {
      return res.status(500).json({ error: 'Missing data.' });
    }

    /**
     * Check whether the provided address owns a TalentLayer Id
     */
    const response = await getTalentLayerUserByAddress(
      Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID),
      body.userAddress,
    );

    const talentLayerUser = response?.data?.data?.users[0];

    if (!talentLayerUser) {
      return res.status(401).json({ error: 'Your address does not own a TalentLayer Id' });
    }

    /**
     * @notice: Check whether the user already owns a profile
     * @dev: We check by address and status as it's the only proof that a user signed a message
     * with this address to validate this profile. If the status is not validated we create a new profile.
     */
    const existingProfile = await getUserByAddress(body.userAddress);
    if (existingProfile && existingProfile.status === EntityStatus.VALIDATED) {
      return res.status(401).json({ error: ALREADY_HAVE_PROFILE });
    }

    /**
     * @dev: Checks whether the user exists in the database
     */
    const userProfile = await getUserById(body.id as string);
    if (!userProfile) {
      return res.status(400).json({ error: PROFILE_DOES_NOT_EXIST });
    }
    if (!!userProfile.talentLayerId && userProfile.status === EntityStatus.VALIDATED) {
      return res.status(401).json({ error: PROFILE_ALREADY_HAS_OWNER });
    }

    try {
      /**
       * @dev: If existing pending with same address,
       * remove address from pending profile to avoid conflicts on field "unique" constraint
       */
      if (
        existingProfile &&
        existingProfile.address === body.userAddress &&
        existingProfile.status === EntityStatus.PENDING
      ) {
        await removeAddressFromUser({
          id: existingProfile.id,
          userAddress: existingProfile.address,
        });
      }

      /**
       * Update user profile with owner data
       */
      await setUserOwner({
        id: userProfile.id.toString(),
        userAddress: body.userAddress,
        talentLayerId: body.talentLayerId,
      });
      res.status(200).json({ message: 'Worker Profile updated successfully', id: userProfile.id });
    } catch (error: any) {
      res.status(400).json({ error: error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
