import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'rahbar',
    });
    console.log(
      `\x1b[32m✔ MongoDB Connected\x1b[0m → ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error('\x1b[31m✖ MongoDB Connection Failed:\x1b[0m', error.message);
    process.exit(1);
  }
};
