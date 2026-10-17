import numpy as np
import pytest

xp = np

from project_hyperion_engine import QuantumNoise, AdvancedPEPS

def test_kraus_completeness():
    """
    Validates physical laws: Kraus Operators MUST satisfy Completeness Relation:
    K0^dagger * K0 + K1^dagger * K1 = Identity Matrix.
    """
    gamma = 0.05
    K0, K1 = QuantumNoise.amplitude_damping(gamma)
    
    K0_dag = xp.conjugate(K0.T)
    K1_dag = xp.conjugate(K1.T)
    
    identity_check = xp.dot(K0_dag, K0) + xp.dot(K1_dag, K1)
    I = xp.eye(2, dtype=xp.complex128)
    
    np.testing.assert_allclose(identity_check, I, atol=1e-10)
    print("✅ TEST PASSED: Kraus operators obey Quantum Mechanics.")

def test_von_neumann_entropy_pure_state():
    """A pure quantum state (unentangled) has exactly 0 entropy."""
    peps = AdvancedPEPS(2, 2)
    singular_values = xp.array([1.0, 0.0, 0.0, 0.0])
    entropy = peps.calculate_von_neumann_entropy(singular_values)
    assert entropy == 0.0
    print("✅ TEST PASSED: Pure state entropy is exactly 0.")

def test_von_neumann_entropy_maximally_entangled():
    """A maximally entangled Bell State should yield exactly 1.0 bit of entropy."""
    peps = AdvancedPEPS(2, 2)
    singular_values = xp.array([0.70710678, 0.70710678, 0.0, 0.0])
    entropy = peps.calculate_von_neumann_entropy(singular_values)
    assert np.isclose(entropy, 1.0, atol=1e-5)
    print("✅ TEST PASSED: Maximally entangled entropy correctly calculated.")

def test_svd_truncation_limit():
    """Ensures algorithm NEVER exceeds Maximum Bond Dimension, preventing RAM overflow."""
    MAX_BOND = 16
    peps = AdvancedPEPS(grid_x=2, grid_y=2, max_bond=MAX_BOND)
    
    # Test actual gate application with truncation enforcement
    cz_gate = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -1]]
    peps.apply_noisy_gate_and_truncate(cz_gate, 0, 0, 1)
    
    # Check truncation was applied
    T1, T2 = peps.tensors[(0, 0)], peps.tensors[(0, 1)]
    bond_dim_1 = T1.shape[3]  # Bond dimension after gate
    bond_dim_2 = T2.shape[2]
    
    assert bond_dim_1 <= MAX_BOND, f"T1 bond dim {bond_dim_1} exceeds max {MAX_BOND}"
    assert bond_dim_2 <= MAX_BOND, f"T2 bond dim {bond_dim_2} exceeds max {MAX_BOND}"
    print("✅ TEST PASSED: Memory limits strictly enforced by SVD Truncation.")

def test_entropy_accumulation():
    """Test that entropy accumulation works and can be reset."""
    peps = AdvancedPEPS(grid_x=2, grid_y=2, max_bond=16)
    cz_gate = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -1]]
    
    initial_entropy = peps.total_entropy
    peps.apply_noisy_gate_and_truncate(cz_gate, 0, 0, 1)
    after_gate_entropy = peps.total_entropy
    
    assert after_gate_entropy >= initial_entropy, "Entropy should increase or stay same"
    
    peps.reset_entropy()
    assert peps.total_entropy == 0.0, "Entropy should reset to 0"
    print("✅ TEST PASSED: Entropy accumulation and reset working correctly.")

if __name__ == "__main__":
    test_kraus_completeness()
    test_von_neumann_entropy_pure_state()
    test_von_neumann_entropy_maximally_entangled()
    test_svd_truncation_limit()
    test_entropy_accumulation()
    print("\n✅ ALL TESTS PASSED")
