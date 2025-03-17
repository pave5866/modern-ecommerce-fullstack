import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { Button, TextField, Box, Typography, Container, Paper, Grid, Divider, Avatar, CircularProgress, Alert } from '@mui/material';
import { LockOutlined, Google, GitHub } from '@mui/icons-material';
import { motion } from 'framer-motion';
import logger from '../../services/logger';

// Form doğrulama şeması
const schema = yup.object().shape({
  email: yup
    .string()
    .email('Geçerli bir e-posta adresi giriniz')
    .required('E-posta adresi gereklidir'),
  password: yup
    .string()
    .required('Şifre gereklidir')
});

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const [loginError, setLoginError] = useState(null);
  const from = location.state?.from?.pathname || '/';

  // React Hook Form yapılandırması
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Kullanıcı zaten oturum açmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      logger.info("Kullanıcı zaten oturum açmış, yönlendiriliyor:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Form gönderme işleyicisi
  const onSubmit = async (data) => {
    try {
      setLoginError(null);
      await login(data.email, data.password);
      logger.info("Giriş başarılı, yönlendiriliyor:", from);
      navigate(from, { replace: true });
    } catch (error) {
      logger.error("Giriş hatası:", error);
      if (error.response) {
        setLoginError(error.response.data.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol ediniz.');
      } else if (error.request) {
        setLoginError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        setLoginError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper 
        elevation={3} 
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlined />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('login.title')}
        </Typography>
        
        {loginError && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {loginError}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('login.email')}
            name="email"
            autoComplete="email"
            autoFocus
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={t('login.password')}
            type="password"
            id="password"
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('login.signIn')}
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Link to="/auth/forgot-password" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                {t('login.forgotPassword')}
              </Typography>
            </Link>
            
            <Link to="/auth/register" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                {t('login.noAccount')}
              </Typography>
            </Link>
          </Box>
          
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('login.orContinueWith')}
            </Typography>
          </Divider>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                sx={{ py: 1.5 }}
                disabled
              >
                Google
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHub />}
                sx={{ py: 1.5 }}
                disabled
              >
                GitHub
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;