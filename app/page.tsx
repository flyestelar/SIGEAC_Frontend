'use client'

import Footer from "@/components/layout/Footer";
import Logo from "@/components/misc/Logo";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()

  const onClick = () => {
    router.push('/login')
  }

  return (
    <div className="w-full h-screen flex flex-col lg:flex-row bg-sky-100">
      <div className="w-full flex justify-center h-full bg-clouds bg-cover relative animate-moveBackground rounded-b-full lg:rounded-r-full lg:rounded-b-none">
        <motion.div initial={{ x: -650, y: 750 }}
          transition={{
            duration: 1.5,
            bounce: 0.40,
            type: "spring"
          }}

          animate={{ x: 0, y: 0 }}ll
           className="mt-24 lg:mt-0" key="plane">
          <Image className="lg:absolute lg:top-56 lg:-right-3 w-[600px] lg:w-auto" src={'/plane3.webp'} width={850} height={850} alt="avion" />
        </motion.div>
      </div>
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col justify-center items-center gap-4">
          <Logo />
          <Button onClick={onClick}>Iniciar Sesión - v2.0</Button>
        </div>
        <Footer />
      </div>
    </div>
  );
}
