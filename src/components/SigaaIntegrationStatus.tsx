import React from 'react';
import { Alert, Box, Typography } from '@mui/material';

interface SigaaIntegrationStatusProps {
  useCloudFunctions: boolean;
}

/**
 * Componente para mostrar o status atual da integração com o SIGAA
 */
const SigaaIntegrationStatus: React.FC<SigaaIntegrationStatusProps> = ({ useCloudFunctions }) => {
  return (
    <Box sx={{ marginY: 2 }}>
      {!useCloudFunctions && (
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Usando modo de integração temporário
          </Typography>
          <Typography variant="body2">
            A integração completa requer o plano Blaze do Firebase. 
            Atualmente usando dados simulados para desenvolvimento.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Para ativar a integração real, atualize para o plano Blaze e implante as Cloud Functions.
          </Typography>
        </Alert>
      )}
      
      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 1 }}>
        {useCloudFunctions 
          ? 'Usando Firebase Cloud Functions para integração segura.'
          : 'Modo de desenvolvimento ativo: os dados serão simulados.'}
      </Typography>
    </Box>
  );
};

export default SigaaIntegrationStatus; 