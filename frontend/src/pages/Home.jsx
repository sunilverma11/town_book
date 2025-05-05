import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Book as BookIcon,
  MeetingRoom as RoomIcon,
  CalendarToday as ReservationIcon,
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const features = [
    {
      title: 'Book Catalog',
      description: 'Browse and search our collection of books',
      icon: <BookIcon sx={{ fontSize: 40 }} />,
      path: '/books',
    },
    {
      title: 'Reading Rooms',
      description: 'Reserve a quiet space for reading and studying',
      icon: <RoomIcon sx={{ fontSize: 40 }} />,
      path: '/rooms',
    },
    {
      title: 'My Reservations',
      description: 'View and manage your current reservations',
      icon: <ReservationIcon sx={{ fontSize: 40 }} />,
      path: '/reservations',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome{user?.name ? `, ${user.name}` : ''}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Welcome to TownBook, your community library management system. Here you can
        browse books, reserve reading rooms, and manage your library activities.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 4 }}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={4} key={feature.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2, color: 'primary.main' }}>{feature.icon}</Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {feature.description}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate(feature.path)}
                  fullWidth
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home; 