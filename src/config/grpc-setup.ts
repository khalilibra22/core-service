import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

let userProto: any = null;
let protoLoadPromise: Promise<any> | null = null;

export const LoadProto = async (): Promise<any> => {
  if (userProto) return userProto;
  
  if (!protoLoadPromise) {
    protoLoadPromise = (async () => {
      // Handle both development (src) and production (dist) paths
      let PROTO_PATH = path.join(__dirname, '../../proto/user.proto');
      
      // If running from dist folder, adjust path to point to source proto
      if (__dirname.includes('dist')) {
        PROTO_PATH = path.join(process.cwd(), 'proto/user.proto');
      }
      
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      
      userProto = grpc.loadPackageDefinition(packageDefinition).user;
      return userProto;
    })();
  }
  
  return protoLoadPromise;
};