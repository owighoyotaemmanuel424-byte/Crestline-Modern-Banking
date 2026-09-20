import React from 'react';
import { Navbar } from './Navbar';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileSidebar }) => {
  return <Navbar onOpenMobileSidebar={onOpenMobileSidebar} balance={1485200.50} />;
};

