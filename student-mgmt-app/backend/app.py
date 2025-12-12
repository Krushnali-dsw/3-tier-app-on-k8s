from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'student_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'port': os.getenv('DB_PORT', '5432')
}

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def init_db():
    """Initialize database and create students table"""
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS students (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    age INTEGER NOT NULL,
                    course VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
        finally:
            cursor.close()
            conn.close()

# Initialize database on startup
init_db()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'student-management-backend'})

@app.route('/api/students', methods=['GET'])
def get_students():
    """Get all students"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT * FROM students ORDER BY id')
        students = cursor.fetchall()
        return jsonify([dict(student) for student in students])
    except Exception as e:
        logger.error(f"Error fetching students: {e}")
        return jsonify({'error': 'Failed to fetch students'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    """Get a specific student by ID"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT * FROM students WHERE id = %s', (student_id,))
        student = cursor.fetchone()
        
        if student:
            return jsonify(dict(student))
        else:
            return jsonify({'error': 'Student not found'}), 404
    except Exception as e:
        logger.error(f"Error fetching student: {e}")
        return jsonify({'error': 'Failed to fetch student'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/students', methods=['POST'])
def create_student():
    """Create a new student"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'age', 'course']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('''
            INSERT INTO students (name, email, age, course)
            VALUES (%s, %s, %s, %s)
            RETURNING *
        ''', (data['name'], data['email'], data['age'], data['course']))
        
        new_student = cursor.fetchone()
        conn.commit()
        
        return jsonify(dict(new_student)), 201
    except psycopg2.IntegrityError as e:
        conn.rollback()
        return jsonify({'error': 'Email already exists'}), 409
    except Exception as e:
        conn.rollback()
        logger.error(f"Error creating student: {e}")
        return jsonify({'error': 'Failed to create student'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    """Update an existing student"""
    data = request.get_json()
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if student exists
        cursor.execute('SELECT * FROM students WHERE id = %s', (student_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Student not found'}), 404
        
        # Update student
        cursor.execute('''
            UPDATE students 
            SET name = %s, email = %s, age = %s, course = %s
            WHERE id = %s
            RETURNING *
        ''', (data.get('name'), data.get('email'), data.get('age'), 
              data.get('course'), student_id))
        
        updated_student = cursor.fetchone()
        conn.commit()
        
        return jsonify(dict(updated_student))
    except psycopg2.IntegrityError as e:
        conn.rollback()
        return jsonify({'error': 'Email already exists'}), 409
    except Exception as e:
        conn.rollback()
        logger.error(f"Error updating student: {e}")
        return jsonify({'error': 'Failed to update student'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Delete a student"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM students WHERE id = %s', (student_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Student not found'}), 404
        
        conn.commit()
        return jsonify({'message': 'Student deleted successfully'})
    except Exception as e:
        conn.rollback()
        logger.error(f"Error deleting student: {e}")
        return jsonify({'error': 'Failed to delete student'}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)