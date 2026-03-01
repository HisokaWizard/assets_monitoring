import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Refresh, Edit, Delete, Description } from '@mui/icons-material';
import {
  useGetAssetsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useRefreshNFTsMutation,
  NFTAsset,
} from '../../entities/assets';
import { useGenerateReportMutation, ReportPeriod } from '../../entities/reports';

const REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily Report' },
  { value: 'weekly', label: 'Weekly Report' },
  { value: 'monthly', label: 'Monthly Report' },
  { value: 'quarterly', label: 'Quarterly Report' },
  { value: 'yearly', label: 'Yearly Report' },
];

const calculateFields = (asset: NFTAsset) => {
  const totalValue = (asset.amount || 0) * (asset.floorPrice || 0);
  const totalInvested = (asset.amount || 0) * (asset.middlePrice || 0);
  const profitLoss = totalValue - totalInvested;
  const profitLossPercent = asset.middlePrice && asset.middlePrice > 0 
    ? ((asset.floorPrice - asset.middlePrice) / asset.middlePrice) * 100 
    : 0;
  
  return { totalValue, totalInvested, profitLoss, profitLossPercent };
};

const formatValue = (value: number | null | undefined, type: 'currency' | 'percent' | 'number' = 'number'): string => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  
  if (type === 'percent') {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
  
  return value.toLocaleString('en-US', { maximumFractionDigits: 8 });
};

export const NftsPage: React.FC = () => {
  const { data: assets, isLoading, error, refetch } = useGetAssetsQuery();
  const [createAsset, { isLoading: isCreating }] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();
  const [refreshNFTs, { isLoading: isRefreshing }] = useRefreshNFTsMutation();
  const [generateReport, { isLoading: isGeneratingReport }] = useGenerateReportMutation();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('daily');
  const [formData, setFormData] = useState({
    collectionName: '',
    amount: '',
    middlePrice: '',
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!notification) return;
    
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const nftAssets = assets?.filter((a) => a.type === 'nft') as NFTAsset[] | undefined;

  const handleOpenDialog = (nft?: NFTAsset) => {
    if (nft) {
      setEditingId(nft.id);
      setFormData({
        collectionName: nft.collectionName || '',
        amount: nft.amount?.toString() || '',
        middlePrice: nft.middlePrice?.toString() || '',
      });
    } else {
      setEditingId(null);
      setFormData({ collectionName: '', amount: '', middlePrice: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({ collectionName: '', amount: '', middlePrice: '' });
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateAsset({
          id: editingId,
          data: {
            amount: parseFloat(formData.amount),
            middlePrice: parseFloat(formData.middlePrice),
          },
        });
        setNotification({ type: 'success', message: 'NFT updated successfully' });
      } else {
        await createAsset({
          type: 'nft',
          collectionName: formData.collectionName,
          amount: parseFloat(formData.amount),
          middlePrice: parseFloat(formData.middlePrice),
        });
        setNotification({ type: 'success', message: 'NFT created successfully' });
      }
      handleCloseDialog();
      refetch();
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to save NFT' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAsset(id);
      setNotification({ type: 'success', message: 'NFT deleted successfully' });
      refetch();
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete NFT' });
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshNFTs();
      setNotification({ type: 'success', message: 'NFT quotes updated successfully' });
      refetch();
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to update quotes' });
    }
  };

  const handleGenerateReport = async () => {
    try {
      await generateReport({ period: reportPeriod });
      setNotification({ type: 'success', message: `Report will be sent to your email shortly` });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to generate report' });
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h3" component="h1">
            NFTs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="report-period-label">Report Period</InputLabel>
              <Select
                labelId="report-period-label"
                value={reportPeriod}
                label="Report Period"
                onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
              >
                {REPORT_PERIODS.map((period) => (
                  <MenuItem key={period.value} value={period.value}>
                    {period.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Description />}
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? 'Sending...' : 'Generate Report'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Updating...' : 'Update Quotes'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add NFT
            </Button>
          </Box>
        </Box>

        {notification && (
          <Alert severity={notification.type} sx={{ mb: 2 }} onClose={() => setNotification(null)}>
            {notification.message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load NFTs. Please try again.
          </Alert>
        )}

        {(!nftAssets || nftAssets.length === 0) ? (
          <Alert severity="info">
            No NFTs yet. Add your first NFT to get started.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Collection</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Avg Price</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Floor Price</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Value</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Invested</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">P/L</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">%</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Multiple</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Prev Price</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Daily %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Daily $</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Weekly %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Weekly $</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Monthly %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Monthly $</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Quarter %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Quarter $</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Year %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="right">Year $</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 100 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nftAssets.map((asset) => {
                  const { totalValue, totalInvested, profitLoss, profitLossPercent } = calculateFields(asset);
                  return (
                    <TableRow key={asset.id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{asset.collectionName || '—'}</TableCell>
                      <TableCell align="right">{formatValue(asset.amount)}</TableCell>
                      <TableCell align="right">{formatValue(asset.middlePrice, 'currency')}</TableCell>
                      <TableCell align="right">{formatValue(asset.floorPrice, 'currency')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>{formatValue(totalValue, 'currency')}</TableCell>
                      <TableCell align="right">{formatValue(totalInvested, 'currency')}</TableCell>
                      <TableCell align="right" sx={{ color: profitLoss >= 0 ? 'success.main' : 'error.main', fontWeight: 500 }}>
                        {formatValue(profitLoss, 'currency')}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatValue(profitLossPercent, 'percent')}
                          color={profitLossPercent >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{formatValue(asset.multiple)}</TableCell>
                      <TableCell align="right">{formatValue(asset.previousPrice, 'currency')}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatValue(asset.dailyChange, 'percent')}
                          color={asset.dailyChange >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{formatValue(asset.dailyPrice, 'currency')}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatValue(asset.weeklyChange, 'percent')}
                          color={asset.weeklyChange >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{formatValue(asset.weeklyPrice, 'currency')}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatValue(asset.monthlyChange, 'percent')}
                          color={asset.monthlyChange >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{formatValue(asset.monthlyPrice, 'currency')}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatValue(asset.quartChange, 'percent')}
                          color={asset.quartChange >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{formatValue(asset.quartPrice, 'currency')}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatValue(asset.yearChange, 'percent')}
                          color={asset.yearChange >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{formatValue(asset.yearPrice, 'currency')}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenDialog(asset)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(asset.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit NFT' : 'Add New NFT'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!editingId && (
              <TextField
                label="Collection Name"
                value={formData.collectionName}
                onChange={(e) => setFormData({ ...formData, collectionName: e.target.value })}
                placeholder="e.g., bored-ape-yacht-club"
                fullWidth
                required
              />
            )}
            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, step: '1' }}
            />
            <TextField
              label="Average Purchase Price"
              type="number"
              value={formData.middlePrice}
              onChange={(e) => setFormData({ ...formData, middlePrice: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={isCreating || !formData.amount || !formData.middlePrice || (!editingId && !formData.collectionName)}
          >
            {isCreating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
