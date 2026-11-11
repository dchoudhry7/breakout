import { Redirect } from 'expo-router';
import React from 'react';

import { useStore } from '../lib/store';

export default function Index() {
  const { answers } = useStore();
  return <Redirect href={answers ? '/(tabs)' : '/onboarding'} />;
}
