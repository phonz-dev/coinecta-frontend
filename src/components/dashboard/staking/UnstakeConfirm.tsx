import React, { FC, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  DialogActions,
  useMediaQuery,
  useTheme,
  Button,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DataSpread from '@components/DataSpread';
import { useToken } from '@components/hooks/useToken';
import { formatTokenWithDecimals } from '@lib/utils/assets';
import { useWallet } from '@meshsdk/react';
import { walletNameToId } from '@lib/walletsList';
import { useWalletContext } from '@contexts/WalletContext';
import { ClaimStakeRequest, coinectaSyncApi } from '@server/services/syncApi';

interface IUnstakeConfirmProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  unstakeList: IUnstakeListItem[];
  claimStakeRequest: ClaimStakeRequest;
}

const UnstakeConfirm: FC<IUnstakeConfirmProps> = ({
  open,
  setOpen,
  unstakeList,
  claimStakeRequest
}) => {
  const { cnctDecimals } = useToken();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { connected, wallet } = useWallet();
  const { sessionData, sessionStatus } = useWalletContext();
  const [cardanoApi, setCardanoApi] = useState<any>(undefined);


  useEffect(() => {
    const execute = async () => {
      if (connected && sessionStatus === 'authenticated') {
        const api = await window.cardano[walletNameToId(sessionData?.user.walletType!)!].enable();
        setCardanoApi(api);
      }
    };
    execute();
  }, [connected, sessionData?.user.walletType, sessionStatus]);

  const handleClose = () => {
    setOpen(false);
  };


  const handleSubmit = async () => {
    if (connected) {
      const unsignedTxCbor = await coinectaSyncApi.claimStakeTx(claimStakeRequest);
      const witnesssetCbor = await cardanoApi.signTx(unsignedTxCbor, true);
      const signedTxCbor = await coinectaSyncApi.finalizeTx({
        txWitnessCbor: witnesssetCbor,
        unsignedTxCbor: unsignedTxCbor
      });
      await cardanoApi.submitTx(signedTxCbor);
      setOpen(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      PaperProps={{
        variant: 'outlined',
        elevation: 0
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(3px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: "800",
          fontSize: "32px",
        }}
      >
        Confirm Unstake
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ minWidth: '350px', maxWidth: !fullScreen ? '460px' : null }}>
        <Typography sx={{ mb: 2 }}>
          You are unstaking the following position(s):
        </Typography>
        {unstakeList.map((item, i) => (
          <DataSpread
            key={`${item.currency}-${i}`}
            title={item.currency}
            data={`${formatTokenWithDecimals(BigInt(item.amount), cnctDecimals)}`}
          />
        ))}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', mb: 1 }}>
        <Button variant="contained" color="secondary" onClick={handleSubmit}>
          {/* {`Submit with ${alternateWalletType?.name || sessionData?.user.walletType} wallet`} */}
          {`Unstake`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnstakeConfirm;