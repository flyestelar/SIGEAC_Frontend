import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { User } from '@/types';
import { EditUserDialog } from '../dialogs/ajustes/EditUserDialog';
import { UserCompaniesModulesDialog } from '../dialogs/ajustes/UserCompaniesModulesDialog';

const UserInfoCard = ({ user }: { user: User }) => {
  const isSuperuser = user.roles?.some((role) => role.name === 'SUPERUSER');

  return (
    <Card className="w-[380px]">
      <CardHeader>
        <div className="flex flex-col items-center justify-between">
          <Image className="rounded-full" alt="profile picture" src={'/images/kanye.png'} width={250} height={250} />
          <div className="flex flex-col gap-2 items-center">
            <CardTitle className="text-4xl text-center">
              {user.first_name} {user.last_name}
            </CardTitle>
            <CardDescription>
              {user.roles?.map((role, index) => (
                <Badge key={index} className="bg-black text-[10px]">
                  {role.name}
                </Badge>
              ))}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-center items-center gap-4">
        {isSuperuser ? <UserCompaniesModulesDialog userId={user.id} userName={`${user.first_name} ${user.last_name}`} /> : null}
        <EditUserDialog user={user} />
      </CardFooter>
    </Card>
  );
};

export default UserInfoCard;
