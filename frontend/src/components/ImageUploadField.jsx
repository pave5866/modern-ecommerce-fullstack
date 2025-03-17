import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  Paper,
  FormHelperText,
  Tooltip
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon, 
  Photo as PhotoIcon,
  Code as CodeIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import uploadAPI from '../services/api/uploadAPI';
import logger from '../services/logger';

/**
 * Resim yükleme bileşeni - Tek veya çoklu resim yükleme desteği
 * 
 * @param {Object} props
 * @param {Array} props.images - Mevcut resimler dizisi
 * @param {Function} props.onChange - Resimler değiştiğinde çağrılacak fonksiyon
 * @param {boolean} props.multiple - Çoklu resim yükleme izni
 * @param {string} props.error - Hata mesajı
 * @param {number} props.maxFiles - Maksimum dosya sayısı (çoklu modda)
 * @param {boolean} props.disabled - Bileşenin devre dışı bırakılma durumu
 * @returns {JSX.Element}
 */
const ImageUploadField = ({ 
  images = [], 
  onChange, 
  multiple = false, 
  error,
  maxFiles = 5,
  disabled = false
}) => {
  const [files, setFiles] = useState(images);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showBase64Input, setShowBase64Input] = useState(false);
  const [base64Image, setBase64Image] = useState('');

  // images prop değiştiğinde state'i güncelle
  useEffect(() => {
    setFiles(images);
  }, [images]);

  // Dropzone konfigürasyonu
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: multiple ? maxFiles : 1,
    multiple: multiple,
    disabled: loading || disabled,
    onDrop: async (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      
      setUploadError('');
      setLoading(true);
      
      try {
        let newImages = [];
        
        if (multiple) {
          // Çoklu resim yükleme işlemi
          if (files.length + acceptedFiles.length > maxFiles) {
            setUploadError(`En fazla ${maxFiles} resim yükleyebilirsiniz`);
            setLoading(false);
            return;
          }
          
          const result = await uploadAPI.uploadImages(acceptedFiles);
          newImages = [...files, ...result.images];
        } else {
          // Tek resim yükleme işlemi
          const result = await uploadAPI.uploadImage(acceptedFiles[0]);
          newImages = [result.image]; // Tek resim durumunda eski resimleri temizle
        }
        
        setFiles(newImages);
        onChange(newImages);
      } catch (error) {
        logger.error('Resim yükleme hatası:', error);
        setUploadError(error.response?.data?.message || 'Resim yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  });

  // URL'den resim yükleme
  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) return;
    
    setUploadError('');
    setLoading(true);
    
    try {
      const result = await uploadAPI.uploadImageFromUrl(imageUrl);
      
      if (multiple) {
        if (files.length + 1 > maxFiles) {
          setUploadError(`En fazla ${maxFiles} resim yükleyebilirsiniz`);
          setLoading(false);
          return;
        }
        const newImages = [...files, result.image];
        setFiles(newImages);
        onChange(newImages);
      } else {
        setFiles([result.image]);
        onChange([result.image]);
      }
      
      setImageUrl('');
      setShowImageUrlInput(false);
    } catch (error) {
      logger.error('URL\'den resim yükleme hatası:', error);
      setUploadError(error.response?.data?.message || 'URL\'den resim yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Base64 resim verisi yükleme
  const handleBase64Upload = async () => {
    if (!base64Image.trim()) return;
    
    setUploadError('');
    setLoading(true);
    
    try {
      const result = await uploadAPI.uploadBase64Image(base64Image);
      
      if (multiple) {
        if (files.length + 1 > maxFiles) {
          setUploadError(`En fazla ${maxFiles} resim yükleyebilirsiniz`);
          setLoading(false);
          return;
        }
        const newImages = [...files, result.image];
        setFiles(newImages);
        onChange(newImages);
      } else {
        setFiles([result.image]);
        onChange([result.image]);
      }
      
      setBase64Image('');
      setShowBase64Input(false);
    } catch (error) {
      logger.error('Base64 resim yükleme hatası:', error);
      setUploadError(error.response?.data?.message || 'Base64 resim verisi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Resim silme işlemi
  const handleRemoveImage = async (index) => {
    try {
      const imageToRemove = files[index];
      
      if (imageToRemove.public_id) {
        await uploadAPI.deleteImage(imageToRemove.public_id);
      }
      
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onChange(newFiles);
    } catch (error) {
      logger.error('Resim silme hatası:', error);
      setUploadError('Resim silinirken bir hata oluştu');
    }
  };

  return (
    <Box>
      {/* Yüklenen Resimler Listesi */}
      {files.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <ImageList cols={multiple ? 3 : 1} gap={8}>
            {files.map((file, index) => (
              <ImageListItem key={index} sx={{ position: 'relative' }}>
                <img
                  src={file.url || file.secure_url}
                  alt={`Yüklenen resim ${index + 1}`}
                  loading="lazy"
                  style={{ 
                    borderRadius: '8px', 
                    height: multiple ? 120 : 200, 
                    width: '100%', 
                    objectFit: 'cover' 
                  }}
                />
                {!disabled && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.8)'
                      }
                    }}
                    size="small"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}

      {/* Yükleme Alanı */}
      {(!multiple || files.length < maxFiles) && !disabled && (
        <>
          <Paper
            {...getRootProps()}
            elevation={2}
            sx={{
              p: 2,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : error ? 'error.main' : 'divider',
              borderRadius: 2,
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 150,
              transition: 'all 0.2s ease'
            }}
          >
            <input {...getInputProps()} />
            {loading ? (
              <CircularProgress size={32} />
            ) : (
              <>
                <CloudUploadIcon fontSize="large" color="primary" sx={{ mb: 1 }} />
                <Typography variant="body1" align="center" gutterBottom>
                  {isDragActive
                    ? 'Resimleri buraya bırakın'
                    : 'Resimleri seçmek için buraya tıklayın veya sürükleyin'}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {multiple
                    ? `PNG, JPG, WEBP veya GIF (max ${maxFiles} dosya)`
                    : 'PNG, JPG, WEBP veya GIF'}
                </Typography>
              </>
            )}
          </Paper>

          {/* Alternatif Yükleme Yöntemleri */}
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item>
              <Tooltip title="URL'den resim yükle">
                <Button
                  startIcon={<LinkIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowImageUrlInput(!showImageUrlInput);
                    setShowBase64Input(false);
                  }}
                  color={showImageUrlInput ? "primary" : "inherit"}
                >
                  URL
                </Button>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Base64 formatında resim yükle">
                <Button
                  startIcon={<CodeIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowBase64Input(!showBase64Input);
                    setShowImageUrlInput(false);
                  }}
                  color={showBase64Input ? "primary" : "inherit"}
                >
                  Base64
                </Button>
              </Tooltip>
            </Grid>
          </Grid>

          {/* URL Giriş Alanı */}
          {showImageUrlInput && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Resim URL'sini girin"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      fontSize: '14px'
                    }}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleUrlUpload}
                    disabled={loading || !imageUrl}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Yükle'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Base64 Giriş Alanı */}
          {showBase64Input && (
            <Box sx={{ mt: 2 }}>
              <textarea
                value={base64Image}
                onChange={(e) => setBase64Image(e.target.value)}
                placeholder="Base64 formatında resim verisini girin"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  minHeight: '80px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleBase64Upload}
                  disabled={loading || !base64Image}
                >
                  {loading ? <CircularProgress size={20} /> : 'Yükle'}
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Hata Mesajı */}
      {(error || uploadError) && (
        <FormHelperText error>
          {error || uploadError}
        </FormHelperText>
      )}
    </Box>
  );
};

export default ImageUploadField;