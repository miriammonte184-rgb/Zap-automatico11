import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetWhatsappStatus, 
  useGetWhatsappQrcode, 
  useDisconnectWhatsapp,
  useConnectWhatsapp,
  useGetSpreadsheetStatus,
  useGetSpreadsheetStats,
  useUploadSpreadsheet,
  useGetQueryStats,
  useGetQueryHistory,
  useQueryByOp,
  useQueryByMaterial,
  useGetWhitelist,
  useAddToWhitelist,
  useRemoveFromWhitelist,
  getGetWhatsappStatusQueryKey,
  getGetSpreadsheetStatusQueryKey,
  getGetWhitelistQueryKey,
} from "@workspace/api-client-react";

// WA Polling Hook
export function useWhatsAppConnection() {
  const queryClient = useQueryClient();
  
  const statusQuery = useGetWhatsappStatus({
    query: { refetchInterval: (data) => {
      const s = data?.state?.data?.status;
      return (s === 'connecting' || s === 'qr_ready') ? 2000 : 5000;
    }}
  });

  const isQrReady = statusQuery.data?.status === 'qr_ready';
  
  const qrQuery = useGetWhatsappQrcode({
    query: {
      enabled: isQrReady,
      refetchInterval: isQrReady ? 3000 : false,
    }
  });

  const connectMutation = useConnectWhatsapp({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
      }
    }
  });

  const disconnectMutation = useDisconnectWhatsapp({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
      }
    }
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    qrCode: qrQuery.data?.qrCode,
    isQrLoading: qrQuery.isLoading && isQrReady,
    connect: () => connectMutation.mutate({}),
    isConnecting: connectMutation.isPending,
    disconnect: () => disconnectMutation.mutate({}),
    isDisconnecting: disconnectMutation.isPending
  };
}

// Whitelist Hook
export function useWhitelistManager() {
  const queryClient = useQueryClient();

  const listQuery = useGetWhitelist({
    query: { refetchInterval: 10000 }
  });

  const addMutation = useAddToWhitelist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWhitelistQueryKey() });
      }
    }
  });

  const removeMutation = useRemoveFromWhitelist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWhitelistQueryKey() });
      }
    }
  });

  return {
    whitelist: listQuery.data?.numbers ?? [],
    total: listQuery.data?.total ?? 0,
    isLoading: listQuery.isLoading,
    add: (phone: string) => addMutation.mutateAsync({ data: { phone } }),
    isAdding: addMutation.isPending,
    addError: addMutation.data?.success === false ? addMutation.data.message : null,
    remove: (phone: string) => removeMutation.mutateAsync({ phone: encodeURIComponent(phone) }),
    isRemoving: removeMutation.isPending,
  };
}

// Spreadsheet Hook
export function useSpreadsheetManager() {
  const queryClient = useQueryClient();
  
  const statusQuery = useGetSpreadsheetStatus({
    query: { refetchInterval: 10000 }
  });

  const statsQuery = useGetSpreadsheetStats({
    query: { refetchInterval: 15000 }
  });

  const uploadMutation = useUploadSpreadsheet({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSpreadsheetStatusQueryKey() });
      }
    }
  });

  return {
    status: statusQuery.data,
    stats: statsQuery.data,
    isLoading: statusQuery.isLoading,
    upload: (file: File) => uploadMutation.mutate({ data: { file } }),
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error
  };
}

// Stats & History
export function useDashboardData() {
  const statsQuery = useGetQueryStats({
    query: { refetchInterval: 30000 }
  });
  
  const historyQuery = useGetQueryHistory({ limit: 10 }, {
    query: { refetchInterval: 30000 }
  });

  return {
    stats: statsQuery.data,
    history: historyQuery.data,
    isLoading: statsQuery.isLoading || historyQuery.isLoading
  };
}
