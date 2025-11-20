import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

// Configure axios defaults - use relative URLs for Kubernetes
axios.defaults.baseURL = '';

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    course: ''
  });

  // Fetch students from backend
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      setStudents(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch students. Please make sure the backend is running.');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (!formData.age || formData.age < 1 || formData.age > 150) {
      setError('Please enter a valid age (1-150)');
      return false;
    }
    if (!formData.course.trim()) {
      setError('Course is required');
      return false;
    }
    return true;
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      if (editingStudent) {
        // Update existing student
        await axios.put(`/api/students/${editingStudent.id}`, formData);
        setSuccess('Student updated successfully!');
        setEditingStudent(null);
      } else {
        // Create new student
        await axios.post('/api/students', formData);
        setSuccess('Student added successfully!');
      }
      
      // Reset form and refresh students list
      setFormData({ name: '', email: '', age: '', course: '' });
      fetchStudents();
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Email already exists. Please use a different email.');
      } else {
        setError('Failed to save student. Please try again.');
      }
      console.error('Error saving student:', err);
    }
  };

  // Handle delete student
  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await axios.delete(`/api/students/${studentId}`);
      setSuccess('Student deleted successfully!');
      fetchStudents();
    } catch (err) {
      setError('Failed to delete student. Please try again.');
      console.error('Error deleting student:', err);
    }
  };

  // Handle edit student
  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      age: student.age.toString(),
      course: student.course
    });
    setError('');
    setSuccess('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingStudent(null);
    setFormData({ name: '', email: '', age: '', course: '' });
    setError('');
    setSuccess('');
  };

  return (
    <div className="App">
      {/* Header */}
      <div className="app-header">
        <Container>
          <Row>
            <Col>
              <h1 className="text-center mb-0">
                📚 Student Management System
              </h1>
              <p className="text-center mb-0 mt-2">
                React Frontend • Flask Backend • PostgreSQL Database
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {/* Add/Edit Student Form */}
        <Row>
          <Col lg={8} className="mx-auto">
            <div className="form-container">
              <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter student name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age</Form.Label>
                      <Form.Control
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder="Enter age"
                        min="1"
                        max="150"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Course</Form.Label>
                      <Form.Control
                        type="text"
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        placeholder="Enter course name"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit">
                    {editingStudent ? 'Update Student' : 'Add Student'}
                  </Button>
                  {editingStudent && (
                    <Button variant="secondary" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Form>
            </div>
          </Col>
        </Row>

        {/* Students List */}
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Students List ({students.length})</h3>
              <Button variant="outline-primary" onClick={fetchStudents}>
                🔄 Refresh
              </Button>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Loading students...</span>
              </div>
            ) : students.length === 0 ? (
              <Alert variant="info" className="text-center">
                No students found. Add your first student above!
              </Alert>
            ) : (
              <div className="student-grid">
                {students.map((student) => (
                  <Card key={student.id} className="student-card">
                    <Card.Body>
                      <Card.Title className="d-flex justify-content-between align-items-start">
                        <span>{student.name}</span>
                        <small className="text-muted">ID: {student.id}</small>
                      </Card.Title>
                      <Card.Text>
                        <strong>📧 Email:</strong> {student.email}<br />
                        <strong>🎂 Age:</strong> {student.age}<br />
                        <strong>📚 Course:</strong> {student.course}<br />
                        <small className="text-muted">
                          Added: {new Date(student.created_at).toLocaleDateString()}
                        </small>
                      </Card.Text>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(student)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(student.id)}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Col>
        </Row>

        {/* Footer */}
        <Row className="mt-5">
          <Col>
            <hr />
            <p className="text-center text-muted">
              Student Management System - Three-Tier Architecture Demo
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;