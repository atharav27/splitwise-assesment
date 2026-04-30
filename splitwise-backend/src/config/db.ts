import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    logger.info({ host: conn.connection.host }, 'MongoDB connected');
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed');
    process.exit(1);
  }
};

export default connectDB;
