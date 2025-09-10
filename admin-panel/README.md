# Exam Portal - Admin Panel

A standalone admin panel for managing the Exam Portal system. This is a completely separate React application from the main student exam portal.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Backend server running on http://localhost:5001

### Installation & Setup

1. **Navigate to admin panel directory**
   ```bash
   cd admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the admin panel**
   ```bash
   npm start
   ```

4. **Access the admin panel**
   - Open http://localhost:3001 in your browser
   - Enter admin password: `admin123`

## 🔐 Authentication

- **Demo Password**: `admin123`
- **Production**: Replace with proper authentication system

## 📋 Features

### QuestionBank Management
- **View Active Exam Codes**: Browse all exam codes from QuestionBank sheet
- **Exam Details**: Click any exam code to see:
  - Total clips count
  - Active clips count  
  - Individual clip information (ID, intervention status, timing, video links)
- **Delete Exam**: Remove entire exams (all clips with same exam code)
- **Create/Edit Exam**: Placeholder functionality ready for implementation

### View Results (Analysis Dashboard)
- **Summary Statistics**: Total attempts, completed exams, in-progress, average scores
- **Detailed Results Table**: Individual exam attempts with:
  - User ID, Exam Code, Status, Score
  - Start/End times
  - Color-coded status indicators
- **Filtering**: Filter results by specific exam codes
- **Real-time Data**: Live data from Exam_Results Google Sheet

## 🏗️ Architecture

### Frontend (React)
- **Standalone Application**: Completely separate from student portal
- **Modern UI**: Tailwind CSS for responsive design
- **Authentication**: Simple password protection
- **Real-time Updates**: Live data from backend APIs

### Backend Integration
Uses existing backend APIs:
```
GET    /api/admin/exam-codes          # Fetch active exam codes
GET    /api/admin/exam/:examCode      # Get exam details  
DELETE /api/admin/exam/:examCode      # Delete entire exam
POST   /api/admin/exam               # Create new exam
PUT    /api/admin/exam/:examCode     # Update existing exam
GET    /api/admin/results            # Get results analysis
```

## 📁 Project Structure

```
admin-panel/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── QuestionBankManagement.js
│   │   └── ExamResultsAnalysis.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── README.md
```

## 🔧 Configuration

### Environment Variables
The admin panel connects to the backend server. Make sure the backend is running on the correct port.

### Proxy Configuration
The `package.json` includes a proxy setting to connect to the backend:
```json
"proxy": "http://localhost:5001"
```

## 🚀 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the build folder**
   - Deploy to your preferred hosting service
   - Ensure backend APIs are accessible
   - Update authentication system for production

## 🔒 Security Considerations

- **Authentication**: Replace demo password with proper authentication
- **HTTPS**: Use HTTPS in production
- **API Security**: Ensure backend APIs are properly secured
- **Access Control**: Implement role-based access control

## 📈 Future Enhancements

- **Advanced Authentication**: JWT tokens, role-based access
- **Create/Edit Exams**: Full CRUD functionality with forms
- **Bulk Operations**: Import/export exam data
- **Advanced Analytics**: Charts, graphs, detailed metrics
- **User Management**: Admin user roles and permissions
- **Audit Logs**: Track all admin actions

## 🤝 Support

For support and questions:
- Check the main project README
- Review backend API documentation
- Ensure Google Sheets permissions are configured
- Verify backend server is running

## 📄 License

This project is licensed under the MIT License.
