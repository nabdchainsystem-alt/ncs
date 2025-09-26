import React, { useEffect } from 'react';
import ComingSoonPage from '../shared/ComingSoonPage';

type SectionComingSoonProps = {
  title: string;
  searchPlaceholder?: string;
};

export default function SectionComingSoon({ title, searchPlaceholder }: SectionComingSoonProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info(`${title} → Coming Soon placeholder rendered`);
  }, [title]);

  return (
    <ComingSoonPage
      title={title}
      searchPlaceholder={searchPlaceholder}
      description="This module is under active development."
    />
  );
}
