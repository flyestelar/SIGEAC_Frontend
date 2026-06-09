import { authorizeUser, UseAuthorizeProps } from './authorization';
import { getCurrentUser } from './user';

export async function authorizeUserServer(options: Omit<UseAuthorizeProps, 'user'>) {
  const user = await getCurrentUser();
  return authorizeUser({ ...options, user });
}
