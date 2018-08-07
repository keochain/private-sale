export default function tokenUnits(fullTokens, d) {
  return new BN(fullTokens).mul(new BN(10).pow(d));
}
