import app from './app';
import { config, assertConfig } from './config';

assertConfig();

app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
});