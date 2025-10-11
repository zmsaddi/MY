import { useState, useMemo } from 'react';
import { getConfirmationConfig } from '../utils/dialogs/getConfirmationConfig';

export function useConfirmDialog(configOverrides = {}) {
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'save',
    data: null,
    action: null
  });

  const openConfirm = (type, data = null, action = null) => {
    setConfirmDialog({ open: true, type, data, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const executeConfirm = async () => {
    if (confirmDialog.action) {
      await confirmDialog.action();
    }
    closeConfirm();
  };

  const dialogConfig = useMemo(
    () => getConfirmationConfig(confirmDialog.type, configOverrides),
    [confirmDialog.type, configOverrides]
  );

  return {
    confirmDialog,
    openConfirm,
    closeConfirm,
    executeConfirm,
    dialogConfig
  };
}

export default useConfirmDialog;
