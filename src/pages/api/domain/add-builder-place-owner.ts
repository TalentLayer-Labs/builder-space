import { NextApiRequest, NextApiResponse } from 'next';
import {
  getBuilderPlaceByDomain,
  getBuilderPlaceByOwnerTlIdAndId,
  updateBuilderPlace,
} from '../../../modules/BuilderPlace/actions';
import { AddBuilderPlaceOwner } from '../../../modules/BuilderPlace/types';
import { checkOwnerSignature, checkSignature } from '../utils/domain';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const body: AddBuilderPlaceOwner = req.body;
    console.log('Received data:', body);

    const response = await checkOwnerSignature(body.id, body.signature, res);

    const currentBuilderPlace = response?.builderPlace;
    const existingSubdomain = await getBuilderPlaceByDomain(body.subdomain);

    if (
      existingSubdomain &&
      existingSubdomain._id.toString() !== currentBuilderPlace._id.toString()
    ) {
      return res.status(500).json({ error: 'Domain already taken.' });
    }

    const result = await updateBuilderPlace(body);

    if (result?.error) {
      res.status(400).json({ error: result.error });
    } else {
      res.status(200).json({ message: 'BuilderPlace domain updated successfully', id: result.id });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
