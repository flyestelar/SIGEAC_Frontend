"use client";
import { useTheme } from 'next-themes';
import Image from 'next/image';
import logo from '@/public/images/logo.png';
import logoDark from '@/public/images/logo-dark.png'

const Logo = () => {
  const {theme} = useTheme();
  return (
    <>
        {
          theme != "dark"
          ?
          <Image src={logo} alt='Logo SIGEAC' width={350} height={350} className='w-auto h-auto'  />
          :
          <Image src={logoDark} alt='Logo SIGEAC' width={350} height={350} className='w-[350px] h-[350px]' />
        }
    </>
  )
}

export default Logo
