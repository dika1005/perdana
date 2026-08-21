import { apiClient } from '../api/client';

export const backupService = {
  downloadSqlBackup: async (): Promise<void> => {
    const res = await apiClient.get('/backup/export', {
      responseType: 'blob',
    });

    // Create a blob link to trigger download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from header or use default
    const contentDisposition = res.headers['content-disposition'];
    let filename = `backup_perdana_pos_${new Date().toISOString().slice(0, 10)}.sql`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
