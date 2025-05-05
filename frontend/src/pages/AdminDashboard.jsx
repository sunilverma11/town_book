import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Container,
  Card,
  CardContent,
  CardActions,
  Stack,
} from '@mui/material';
import { useSelector } from 'react-redux';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { Check as CheckIcon, Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
  });
  const [bookError, setBookError] = useState('');
  const [bookRequests, setBookRequests] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [success, setSuccess] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');
  const [returnError, setReturnError] = useState('');
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({
    name: '',
    capacity: '',
    available: '',
    description: ''
  });
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [roomRequests, setRoomRequests] = useState([]);
  const [roomRequestSuccess, setRoomRequestSuccess] = useState('');
  const [roomRequestError, setRoomRequestError] = useState('');
  const [activeRoomRequests, setActiveRoomRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [processedBookRequests, setProcessedBookRequests] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editRoomDialogOpen, setEditRoomDialogOpen] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'librarian') {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 0) {
        const [reservationsResponse, processedRoomRequests] = await Promise.all([
          axios.get('/reservations'),
          axios.get('/room-requests?status=approved,rejected')
        ]);
        setReservations([...reservationsResponse.data, ...processedRoomRequests.data]);
      } else if (activeTab === 1) {
        const response = await axios.get('/books');
        setBooks(response.data);
      } else if (activeTab === 2) {
        const [pendingRequests, processedRequests, returnsResponse] = await Promise.all([
          axios.get('/book-requests?status=pending'),
          axios.get('/book-requests?status=approved,rejected'),
          axios.get('/book-requests?returnStatus=pending')
        ]);
        const trulyPendingRequests = pendingRequests.data.filter(request => 
          request.status === 'pending' && !request.returnStatus
        );
        setBookRequests(trulyPendingRequests);
        setProcessedBookRequests(processedRequests.data);
        setPendingReturns(returnsResponse.data);
      } else if (activeTab === 3) {
        const [pendingRequests, leaveRequests] = await Promise.all([
          axios.get('/room-requests?status=pending'),
          axios.get('/room-requests?status=approved&leaveRequestStatus=pending')
        ]);
        // Filter out any requests that don't have a pending status
        const validPendingRequests = pendingRequests.data.filter(request => 
          request.status === 'pending'
        );
        const validLeaveRequests = leaveRequests.data.filter(request => 
          request.leaveRequestStatus === 'pending'
        );
        setRoomRequests(validPendingRequests);
        setLeaveRequests(validLeaveRequests);
      } else if (activeTab === 4) {
        const [roomsResponse, activeRequestsResponse] = await Promise.all([
          axios.get('/rooms'),
          axios.get('/room-requests?status=approved&isActive=true')
        ]);
        setRooms(roomsResponse.data);
        setActiveRoomRequests(activeRequestsResponse.data);
      }
      setError('');
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleReservationAction = async (reservationId, action) => {
    try {
      // Convert action to proper enum value
      const statusValue = action === 'approved' ? 'approved' : 'rejected';
      
      await axios.put(`/room-requests/${reservationId}/process`, { status: statusValue });
      setSuccess(`Request ${statusValue} successfully`);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process request');
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/books', newBook);
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        description: '',
      });
      setBookError('');
      fetchData();
    } catch (error) {
      setBookError(error.response?.data?.message || 'Failed to add book');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleProcessRequest = async (requestId, status) => {
    try {
      await axios.put(`/book-requests/${requestId}/process`, { status });
      setSuccess('Request processed successfully');
      const [pendingRequests, processedRequests] = await Promise.all([
        axios.get('/book-requests?status=pending'),
        axios.get('/book-requests?status=approved,rejected')
      ]);
      const trulyPendingRequests = pendingRequests.data.filter(request => 
        request.status === 'pending' && !request.returnStatus
      );
      setBookRequests(trulyPendingRequests);
      setProcessedBookRequests(processedRequests.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process request');
    }
  };

  const handleProcessReturn = async (requestId, status) => {
    try {
      await axios.put(`/book-requests/${requestId}/process-return`, { status });
      setReturnSuccess('Return request processed successfully');
      // Refresh both requests and pending returns
      const [requestsResponse, returnsResponse] = await Promise.all([
        axios.get('/book-requests'),
        axios.get('/book-requests?returnStatus=pending')
      ]);
      setBookRequests(requestsResponse.data);
      setPendingReturns(returnsResponse.data);
    } catch (error) {
      setReturnError(error.response?.data?.message || 'Failed to process return request');
    }
  };

  const handleAddRoom = async () => {
    try {
      // Validate required fields
      if (!newRoom.name || !newRoom.capacity || !newRoom.description) {
        setRoomError('Please fill in all required fields');
        return;
      }

      // Convert and validate capacity
      const capacity = parseInt(newRoom.capacity);
      if (isNaN(capacity) || capacity < 1) {
        setRoomError('Capacity must be a positive number');
        return;
      }

      // Create room data with proper types
      const roomData = {
        name: newRoom.name,
        capacity: capacity,
        available: capacity, // Set available equal to capacity for new rooms
        description: newRoom.description
      };

      await axios.post('/rooms', roomData);
      setRoomDialogOpen(false);
      setNewRoom({ name: '', capacity: '', available: '', description: '' });
      setRoomError('');
      // Refresh rooms
      const response = await axios.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      setRoomError(error.response?.data?.message || 'Failed to add room');
    }
  };

  const handleProcessLeave = async (roomId, status) => {
    try {
      await axios.put(`/rooms/${roomId}/process-leave`, { status });
      setSuccess('Leave request processed successfully');
      // Refresh rooms
      const response = await axios.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process leave request');
    }
  };

  const handleProcessRoomRequest = async (requestId, status) => {
    try {
      // Convert status to proper enum value
      const statusValue = status === 'approve' ? 'approved' : 'rejected';
      
      await axios.put(`/room-requests/${requestId}/process`, { status: statusValue });
      setRoomRequestSuccess(`Room request ${statusValue} successfully`);
      fetchData();
    } catch (error) {
      setRoomRequestError(error.response?.data?.message || `Failed to ${status} room request`);
    }
  };

  const handleProcessLeaveRequest = async (requestId, action) => {
    try {
      // Convert action to proper enum value
      const statusValue = action === 'approve' ? 'approved' : 'rejected';
      
      await axios.put(`/room-requests/${requestId}/process-leave`, { status: statusValue });
      setRoomRequestSuccess('Leave request processed successfully');
      
      // Refresh all relevant data
      const [pendingRequests, leaveRequests, roomsResponse, activeRequestsResponse] = await Promise.all([
        axios.get('/room-requests?status=pending'),
        axios.get('/room-requests?status=approved&leaveRequestStatus=pending'),
        axios.get('/rooms'),
        axios.get('/room-requests?status=approved&isActive=true')
      ]);

      // Filter out any requests that don't have a pending status
      const validPendingRequests = pendingRequests.data.filter(request => 
        request.status === 'pending'
      );
      const validLeaveRequests = leaveRequests.data.filter(request => 
        request.leaveRequestStatus === 'pending'
      );

      setRoomRequests(validPendingRequests);
      setLeaveRequests(validLeaveRequests);
      setRooms(roomsResponse.data);
      setActiveRoomRequests(activeRequestsResponse.data);
    } catch (error) {
      setRoomRequestError(error.response?.data?.message || 'Failed to process leave request');
    }
  };

  const handleUpdateRoom = async (roomId, updates) => {
    try {
      // First get the current room data to ensure we have the correct capacity
      const currentRoom = rooms.find(room => room._id === roomId);
      if (!currentRoom) {
        throw new Error('Room not found');
      }

      // Ensure capacity is at least 1
      if (updates.capacity !== undefined) {
        updates.capacity = Math.max(1, Number(updates.capacity));
      } else {
        updates.capacity = currentRoom.capacity;
      }

      // Ensure available spots are valid
      if (updates.available !== undefined) {
        const available = updates.capacity - updates.currentBooking;
        updates.available = available;
      } else {
        updates.available = currentRoom.available;
      }

      await axios.put(`/rooms/${roomId}`, updates);
      setSuccess('Room updated successfully');
      // Refresh rooms
      const response = await axios.get('/rooms');
      setRooms(response.data);
      setEditRoomDialogOpen(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update room');
    }
  };

  const renderRoomRequestsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pending Room Requests
      </Typography>
      {roomRequests.length === 0 ? (
        <Typography>No pending room requests</Typography>
      ) : (
        <Grid container spacing={2}>
          {roomRequests.map((request) => (
            <Grid item xs={12} key={request._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    Room: {request.room.name}
                  </Typography>
                  <Typography>
                    Requested by: {request.user.name}
                  </Typography>
                  <Typography>
                    Date: {new Date(request.date).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    Purpose: {request.purpose}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={request.status}
                      color="warning"
                    />
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleProcessRoomRequest(request._id, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => handleProcessRoomRequest(request._id, 'reject')}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Pending Leave Requests
      </Typography>
      {leaveRequests.length === 0 ? (
        <Typography>No pending leave requests</Typography>
      ) : (
        <Grid container spacing={2}>
          {leaveRequests.map((request) => (
            <Grid item xs={12} key={request._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    Room: {request.room.name}
                  </Typography>
                  <Typography>
                    Requested by: {request.user.name}
                  </Typography>
                  <Typography>
                    Booked Date: {new Date(request.date).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    Leave Request Date: {new Date(request.leaveRequestDate).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    Purpose: {request.purpose}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label="Leave Request Pending"
                      color="warning"
                    />
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleProcessLeaveRequest(request._id, 'approve')}
                  >
                    Approve Leave
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => handleProcessLeaveRequest(request._id, 'reject')}
                  >
                    Reject Leave
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderBookRequestsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pending Book Requests
      </Typography>
      {bookRequests.length === 0 ? (
        <Typography>No pending book requests</Typography>
      ) : (
        <Grid container spacing={2}>
          {bookRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {request.book.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Requested by: {request.user.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Request Date: {new Date(request.requestDate).toLocaleDateString()}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={request.status}
                      color="warning"
                    />
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleProcessRequest(request._id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => handleProcessRequest(request._id, 'rejected')}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Processed Book Requests
      </Typography>
      {processedBookRequests.length === 0 ? (
        <Typography>No processed book requests</Typography>
      ) : (
        <Grid container spacing={2}>
          {processedBookRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {request.book.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Requested by: {request.user.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Request Date: {new Date(request.requestDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Processed Date: {new Date(request.processedDate).toLocaleDateString()}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={request.status}
                      color={
                        request.status === 'approved' ? 'success' :
                        request.status === 'rejected' ? 'error' : 'default'
                      }
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Pending Return Requests
      </Typography>
      {pendingReturns.length === 0 ? (
        <Typography>No pending return requests</Typography>
      ) : (
        <Grid container spacing={2}>
          {pendingReturns.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {request.book.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Returned by: {request.user.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Borrowed Date: {new Date(request.requestDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Return Request Date: {new Date(request.returnRequestDate).toLocaleDateString()}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={`Return: ${request.returnStatus}`}
                      color="warning"
                    />
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleProcessReturn(request._id, 'approved')}
                  >
                    Approve Return
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => handleProcessReturn(request._id, 'rejected')}
                  >
                    Reject Return
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderRoomManagementTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Room Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setRoomDialogOpen(true)}
        >
          Add New Room
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading rooms...</Typography>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => {
            const activeRequest = activeRoomRequests.find(
              request => request.room._id === room._id
            );
            
            return (
              <Grid item xs={12} sm={6} md={4} key={room._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {room.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Capacity: {room.capacity}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Available Spots: {room.available}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        label={`${room.available}/${room.capacity} Available`}
                        color={room.available > 0 ? 'success' : 'error'}
                      />
                      {activeRequest?.leaveRequestStatus === 'pending' && (
                        <Chip
                          label="Leave Request Pending"
                          color="warning"
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" color="textSecondary">
                      {room.description}
                    </Typography>
                    {activeRequest && (
                      <>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Booked by: {activeRequest.user.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Date: {new Date(activeRequest.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Purpose: {activeRequest.purpose}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectedRoom(room);
                        setEditRoomDialogOpen(true);
                      }}
                    >
                      Edit Room
                    </Button>
                    {activeRequest?.leaveRequestStatus === 'pending' && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleProcessLeaveRequest(activeRequest._id, 'approve')}
                        >
                          Approve Leave
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleProcessLeaveRequest(activeRequest._id, 'reject')}
                        >
                          Reject Leave
                        </Button>
                      </Stack>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={editRoomDialogOpen} onClose={() => setEditRoomDialogOpen(false)}>
        <DialogTitle>Edit Room</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Room Name"
              value={selectedRoom?.name || ''}
              onChange={(e) => setSelectedRoom({ ...selectedRoom, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Capacity"
              type="number"
              value={selectedRoom?.capacity || ''}
              onChange={(e) => {
                const capacity = Math.max(1, parseInt(e.target.value) || 0);
                setSelectedRoom({ 
                  ...selectedRoom, 
                  capacity,
                  available: Math.min(selectedRoom?.available || capacity, capacity)
                });
              }}
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Current Bookings"
              type="number"
              value={selectedRoom?.currentBooking || ''}
              // onChange={(e) => {
              //   const available = Math.max(0, parseInt(e.target.value) || 0);
              //   setSelectedRoom({ 
              //     ...selectedRoom, 
              //     available: Math.min(available, selectedRoom?.capacity || available)
              //   });
              // }}
              sx={{ mb: 2 }}
              disabled
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={selectedRoom?.description || ''}
              onChange={(e) => setSelectedRoom({ ...selectedRoom, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoomDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              handleUpdateRoom(selectedRoom._id, selectedRoom);
            }} 
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roomDialogOpen} onClose={() => setRoomDialogOpen(false)}>
        <DialogTitle>Add New Room</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Room Name"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Capacity"
              type="number"
              value={newRoom.capacity}
              onChange={(e) => {
                const capacity = Math.max(1, parseInt(e.target.value) || 0);
                setNewRoom({ 
                  ...newRoom, 
                  capacity,
                  available: Math.min(newRoom.available || capacity, capacity)
                });
              }}
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Available Spots"
              type="number"
              value={newRoom.available}
              onChange={(e) => {
                const available = Math.max(0, parseInt(e.target.value) || 0);
                setNewRoom({ 
                  ...newRoom, 
                  available: Math.min(available, newRoom.capacity || available)
                });
              }}
              inputProps={{ min: 0, max: newRoom.capacity }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newRoom.description}
              onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddRoom} variant="contained">
            Add Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {returnSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setReturnSuccess('')}>
            {returnSuccess}
          </Alert>
        )}
        {returnError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setReturnError('')}>
            {returnError}
          </Alert>
        )}
        {roomRequestSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRoomRequestSuccess('')}>
            {roomRequestSuccess}
          </Alert>
        )}
        {roomRequestError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRoomRequestError('')}>
            {roomRequestError}
          </Alert>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Reservations" />
          <Tab label="Books" />
          <Tab label="Book Requests" />
          <Tab label="Room Requests" />
          <Tab label="Room Management" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation._id}>
                  <TableCell>{reservation.user.name}</TableCell>
                  <TableCell>{reservation.room.name}</TableCell>
                  <TableCell>{new Date(reservation.date).toLocaleDateString()}</TableCell>
                  <TableCell>{reservation.purpose}</TableCell>
                  <TableCell>
                    <Chip
                      label={reservation.status}
                      color={getStatusColor(reservation.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={reservation.leaveRequestStatus ? 'Leave Request' : 'Room Request'}
                      color={reservation.leaveRequestStatus ? 'warning' : 'primary'}
                    />
                  </TableCell>
                  <TableCell>
                    {reservation.status === 'pending' && !reservation.leaveRequestStatus && (
                      <>
                        <Button
                          color="success"
                          onClick={() => handleReservationAction(reservation._id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          color="error"
                          onClick={() => handleReservationAction(reservation._id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {reservation.leaveRequestStatus === 'pending' && (
                      <>
                        <Button
                          color="success"
                          onClick={() => handleProcessLeaveRequest(reservation._id, 'approve')}
                        >
                          Approve Leave
                        </Button>
                        <Button
                          color="error"
                          onClick={() => handleProcessLeaveRequest(reservation._id, 'reject')}
                        >
                          Reject Leave
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && (
        <Box sx={{ p: 2 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add New Book
            </Typography>
            {bookError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {bookError}
              </Alert>
            )}
            <form onSubmit={handleAddBook}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Author"
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ISBN"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary">
                    Add Book
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>

          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/book-requests')}
            sx={{ mb: 2 }}
          >
            Manage Book Requests
          </Button>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>ISBN</TableCell>
                  <TableCell>Available Copies</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book._id}>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.isbn}</TableCell>
                    <TableCell>{book.availableCopies}</TableCell>
                    <TableCell>
                      <Chip
                        label={book.availableCopies > 0 ? 'Available' : 'Unavailable'}
                        color={book.availableCopies > 0 ? 'success' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 2 && renderBookRequestsTab()}

      {activeTab === 3 && (
        renderRoomRequestsTab()
      )}

      {activeTab === 4 && (
        renderRoomManagementTab()
      )}
    </Container>
  );
};

export default AdminDashboard; 