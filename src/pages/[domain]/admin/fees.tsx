import { GetServerSidePropsContext } from 'next';
import { useContext } from 'react';
import { formatEther } from 'viem';
import { useChainId } from 'wagmi';
import * as Yup from 'yup';
import SingleValueForm from '../../../components/Form/SingleValueForm';
import Loading from '../../../components/Loading';
import Steps from '../../../components/Steps';
import UserNeedsMoreRights from '../../../components/UserNeedsMoreRights';
import { FEE_RATE_DIVIDER } from '../../../config';
import TalentLayerPlatformID from '../../../contracts/ABI/TalentLayerPlatformID.json';
import { useConfig } from '../../../hooks/useConfig';
import usePlatform from '../../../hooks/usePlatform';
import { sharedGetServerSideProps } from '../../../utils/sharedGetServerSideProps';
import { chains } from '../../../context/web3modal';
import BuilderPlaceContext from '../../../modules/BuilderPlace/context/BuilderPlaceContext';
import UserContext from '../../../modules/BuilderPlace/context/UserContext';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return sharedGetServerSideProps(context);
}

function AdminFees() {
  const chainId = useChainId();
  const { user, loading } = useContext(UserContext);
  const { isBuilderPlaceOwner, builderPlace } = useContext(BuilderPlaceContext);
  const config = useConfig();
  const platform = usePlatform(builderPlace?.talentLayerPlatformId);
  const currentChain = chains.find(chain => chain.id === chainId);

  if (loading) {
    return <Loading />;
  }
  if (!user) {
    return <Steps />;
  }
  if (!isBuilderPlaceOwner) {
    return <UserNeedsMoreRights />;
  }

  return (
    <div className='max-w-7xl mx-auto text-base-content'>
      <div className=' -mx-6 -mt-6 '>
        <div className='flex py-2 px-6 items-center border-b w-full border-info mb-8'>
          <p className='text-2xl font-bold flex-1 mt-6'>Fees strategies</p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 border border-info rounded-xl p-6 bg-base-100'>
        <SingleValueForm
          validationData={{
            validationSchema: Yup.object({
              'Fees (in %) on escrow for bringing the service': Yup.number()
                .required('value is required')
                .min(0)
                .max(100),
            }),
            valueType: 'number',
            initialValue: ((platform?.originServiceFeeRate || 0) * 100) / FEE_RATE_DIVIDER,
          }}
          contractParams={{
            contractFunctionName: 'updateOriginServiceFeeRate',
            contractAddress: config.contracts.talentLayerPlatformId,
            contractAbi: TalentLayerPlatformID.abi,
            contractEntity: 'platform',
            contractInputs: builderPlace?.talentLayerPlatformId,
          }}
          valueName={'Fees (in %) on escrow for bringing the service'}
        />

        <SingleValueForm
          validationData={{
            validationSchema: Yup.object({
              [`Fees (in ${currentChain?.nativeCurrency.symbol}) asked by the platform to post a service on the platform`]:
                Yup.number().required('value is required'),
            }),
            valueType: 'number',
            initialValue: platform?.servicePostingFee
              ? formatEther(BigInt(platform?.servicePostingFee))
              : 0,
          }}
          contractParams={{
            contractFunctionName: 'updateServicePostingFee',
            contractAddress: config.contracts.talentLayerPlatformId,
            contractAbi: TalentLayerPlatformID.abi,
            contractEntity: 'platform',
            contractInputs: builderPlace?.talentLayerPlatformId,
          }}
          valueName={`Fees (in ${currentChain?.nativeCurrency.symbol}) asked by the platform to post a service on the platform`}
        />
      </div>
    </div>
  );
}

export default AdminFees;
