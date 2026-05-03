import React from 'react';
import { Box, styled } from '@mui/material';
import Header from '../components/Header';
import FilamentadoraSection from '../components/FilamentadoraSections';

const PageContainer = styled(Box)({
  backgroundColor: '#0A192F',
  color: '#CBD6E3',
  minHeight: '100vh',
  padding: '20px',
});

export default function Filamentadora2() {
  return (
    <PageContainer>
      <Header title="Control de Filamentadora / Vista de Bobinado" />
      <FilamentadoraSection />
    </PageContainer>
  );
}
