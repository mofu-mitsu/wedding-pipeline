import { execSync } from 'child_process';
try {
  execSync('git checkout src/components/CeremonyStage.tsx');
  console.log('Restored CeremonyStage.tsx');
} catch (e) {
  console.log(e.toString());
}
