import { Redirect } from "expo-router";
import { useAppContext } from "@/contexts/app-context";

export default function Index() {
  const { currentUser, isBootstrapping } = useAppContext();

  if (isBootstrapping) {
    return null;
  }

  if (currentUser) {
    return <Redirect href="/(main)/(tabs)/discover" />;
  }

  return <Redirect href="/(auth)/login" />;
}
