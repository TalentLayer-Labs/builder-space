import { Menu, Transition } from '@headlessui/react';
import { Fragment, useContext, useEffect, useState } from 'react';
import TalentLayerContext from '../context/talentLayer';
import ConnectBlock from './ConnectBlock';
import ProfileImage from './ProfileImage';
import UserSubMenu from './UserSubMenu';
import UserContext from '../modules/BuilderPlace/context/UserContext';
import { useAccount } from 'wagmi';

function UserAccount() {
  const { isConnected } = useAccount();
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

  // Tips to prevent nextJs error: Hydration failed because the initial UI does not match what was rendered on the server.
  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className='flex justify-between'>
        <div className='pr-4 flex items-center'>
          <ConnectBlock />
        </div>
      </div>
    );
  }

  return (
    <div className='flex justify-between'>
      <div className='pr-4 flex items-center'>
        <Menu as='div' className='relative'>
          <div>
            <div className='flex items-center relative group'>
              <Menu.Button className='group-hover:ring-redpraha ring-offset-midnight inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-transparent transition-all duration-300 group-hover:ring-offset-4'>
                <span className='sr-only'>Open user menu</span>
                <ProfileImage size={50} url={user?.picture} />
              </Menu.Button>
            </div>
          </div>
          <Transition
            as={Fragment}
            enter='transition ease-out duration-100'
            enterFrom='transform opacity-0 scale-95'
            enterTo='transform opacity-100 scale-100'
            leave='transition ease-in duration-75'
            leaveFrom='transform opacity-100 scale-100'
            leaveTo='transform opacity-0 scale-95'>
            <Menu.Items className='absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl bg-base-200 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
              <UserSubMenu />
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
}

export default UserAccount;
