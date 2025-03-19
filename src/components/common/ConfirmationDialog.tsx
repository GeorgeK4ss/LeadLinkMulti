import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  content: string | React.ReactNode;
  confirmText: string;
  cancelText: string;
  isProcessing?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmButtonColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  content,
  confirmText,
  cancelText,
  isProcessing = false,
  onConfirm,
  onCancel,
  confirmButtonColor = 'primary'
}) => {
  const handleConfirm = async () => {
    if (isProcessing) return;
    
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error during confirmation action:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onCancel}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {typeof content === 'string' ? (
          <DialogContentText id="confirmation-dialog-description">
            {content}
          </DialogContentText>
        ) : (
          <>{content}</>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onCancel} 
          color="inherit" 
          disabled={isProcessing}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          color={confirmButtonColor}
          variant="contained"
          disabled={isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} /> : null}
          autoFocus
        >
          {isProcessing ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 