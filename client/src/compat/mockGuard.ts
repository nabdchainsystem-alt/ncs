export function blockMock(name: string): never {
  throw new Error(`Mock import blocked: ${name}`);
}
