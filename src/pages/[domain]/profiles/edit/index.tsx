import ProfileForm from '../../../../components/Form/ProfileForm';
import Layout from '../../../../components/EditProfile/Layout';
import { getBuilderPlace } from '../../../../modules/BuilderPlace/queries';
import { useContext } from 'react';
import TalentLayerContext from '../../../../context/talentLayer';

export async function getServerSideProps({ params }: any) {
  return await getBuilderPlace(params.domain);
}

function EditProfile() {
  const { user } = useContext(TalentLayerContext);

  return (
    <Layout>
      <ProfileForm user={user} />
    </Layout>
  );
}

export default EditProfile;
