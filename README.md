# RightsLab

A comprehensive medical testing and lab management platform built with Next.js.

## Features

- **User Authentication**: Secure login and registration with OTP verification
- **Admin Dashboard**: Complete admin panel with analytics and management tools
- **Vendor Management**: Comprehensive vendor management system
- **Booking System**: Medical test booking and management
- **Real-time Analytics**: Dashboard with charts and metrics
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: Custom JWT implementation
- **SMS Service**: Twilio for OTP verification
- **Charts**: Recharts for data visualization

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/ramakrishna3183/Rightslab.git
cd Rightslab
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your configuration:
```env
MONGODB_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SERVICE_SID=your_twilio_service_sid
TWILIO_PHONE_NUMBER=your_twilio_phone_number
ENABLE_OTP_BYPASS=false
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
rightslab/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # Reusable components
│   └── lib/                 # Utility functions
├── public/                  # Static assets
└── ...config files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
