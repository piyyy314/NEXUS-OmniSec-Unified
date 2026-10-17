import json
from datetime import datetime

class QuantumRiskEngine:
    """Evaluates cryptographic risk and migration timelines based on system parameters."""
    def __init__(self):
        self.crypto_inventory = {
            "rsa-2048": {"risk": "CRITICAL", "action": "Migrate to CRYSTALS-Kyber / Dilithium immediately."},
            "ecc-300": {"risk": "CRITICAL", "action": "Migrate to NIST PQC standards (2024)."},
            "aes-128": {"risk": "MEDIUM", "action": "Upgrade to AES-256 for sufficient quantum margin."},
            "aes-256": {"risk": "LOW", "action": "Acceptable risk. Maintain configuration."},
            "sha-256": {"risk": "LOW", "action": "Acceptable risk. Consider SHA-3 or larger output sizes."}
        }

    def evaluate_crypto(self, primitive_name: str) -> dict:
        key = primitive_name.lower().strip()
        if key in self.crypto_inventory:
            return {"algorithm": primitive_name, **self.crypto_inventory[key]}
        return {"algorithm": primitive_name, "risk": "UNKNOWN", "action": "Manually audit specification."}

    def check_migration_timeline(self, target_year: int) -> dict:
        current_year = datetime.now().year
        years_left = target_year - current_year
        if target_year >= 2035: compliance = "FAIL (Exceeds 2035 deadline)"
        elif target_year > 2030: compliance = "WARNING (Misses 2030 target)"
        else: compliance = "OPTIMAL (Meets industry standards)"
        return {"target_year": target_year, "years_remaining": years_left, "compliance_status": compliance}

class CryptoSoftwareBillOfMaterials:
    """Generates Software Bill of Materials for cryptographic dependencies."""
    def generate_sbom(self, dependencies: list) -> list:
        engine = QuantumRiskEngine()
        entries = []
        for dep in dependencies:
            algo = dep.get("algorithm", "")
            risk = engine.evaluate_crypto(algo)
            entries.append({
                "component": dep.get("name", "unknown"),
                "version": dep.get("version", "unknown"),
                "algorithm": algo,
                "risk_level": risk.get("risk", "UNKNOWN")
            })
        return entries

    def export_cyclonedx(self, entries: list, output_path: str):
        bom = {
            "bomFormat": "CycloneDX", "specVersion": "1.4", "version": 1,
            "components": [{"name": e["component"], "version": e["version"], "type": "library"} for e in entries]
        }
        with open(output_path, "w") as f:
            json.dump(bom, f, indent=2)
        print(f"[+] CycloneDX SBOM exported: {output_path}")

if __name__ == "__main__":
    print("=== PQC COMPLIANCE AUDITOR ===")
    engine = QuantumRiskEngine()
    print(engine.evaluate_crypto("rsa-2048"))
    
    sbom_gen = CryptoSoftwareBillOfMaterials()
    mock_deps = [
        {"name": "openssl", "version": "1.1.1t", "algorithm": "rsa-2048"},
        {"name": "liboqs", "version": "0.8.0", "algorithm": "kyber-768"}
    ]
    sbom = sbom_gen.generate_sbom(mock_deps)
    sbom_gen.export_cyclonedx(sbom, "crypto_sbom.json")