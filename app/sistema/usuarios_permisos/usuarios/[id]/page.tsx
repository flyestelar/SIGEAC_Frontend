'use client';
import { use } from "react";

import UserInfoCard from '@/components/cards/UserInfoCard'
import UserInfoTabs from '@/components/cards/UserInfoTabs'
import { ContentLayout } from '@/components/layout/ContentLayout'
import LoadingPage from '@/components/misc/LoadingPage'
import { useGetUserById } from '@/hooks/sistema/usuario/useGetUserById'

const UserByIdPage = (props: { params: Promise<{ id: string }> }) => {
  const params = use(props.params);

  const { data: user, error, isLoading } = useGetUserById(params.id);


  if (isLoading) {
    return <LoadingPage />
  }


  return (
    <ContentLayout title='USER PAGE'>
      <div className='flex flex-col gap-2 md:flex-row items-center justify-evenly'>
        <UserInfoCard user={user!} />
        <UserInfoTabs user={user!} />
      </div>
    </ContentLayout>
  )
}

export default UserByIdPage
