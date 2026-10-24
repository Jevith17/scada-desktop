package colour

import (
	"math"
	"testing"
)

func TestCIEDE2000_SharmaWuDalalTestPairs(t *testing.T) {
	tests := []struct {
		name     string
		L1, a1, b1 float64
		L2, a2, b2 float64
		expected   float64
		tol        float64
	}{
		{
			name:     "Identical Colors",
			L1:       50.0, a1: 20.0, b1: -30.0,
			L2:       50.0, a2: 20.0, b2: -30.0,
			expected: 0.0,
			tol:      1e-5,
		},
		{
			name:     "Sharma Pair 1",
			L1:       50.0000, a1: 2.6772, b1: -79.7751,
			L2:       50.0000, a2: 0.0000, b2: -82.7485,
			expected: 2.0425,
			tol:      1e-3,
		},
		{
			name:     "Sharma Pair 2",
			L1:       50.0000, a1: 3.1571, b1: -77.2803,
			L2:       50.0000, a2: 0.0000, b2: -82.7485,
			expected: 2.8615,
			tol:      1e-3,
		},
		{
			name:     "Sharma Pair 3",
			L1:       50.0000, a1: 2.8315, b1: -74.0200,
			L2:       50.0000, a2: 0.0000, b2: -82.7485,
			expected: 3.4386,
			tol:      1e-3,
		},
		{
			name:     "Sharma Pair 10",
			L1:       50.0000, a1: 0.0000, b1: 0.0000,
			L2:       50.0000, a2: -1.0000, b2: 2.0000,
			expected: 2.3669,
			tol:      1e-3,
		},
		{
			name:     "Sharma Pair 15",
			L1:       60.2574, a1: -34.0099, b1: 0.5003,
			L2:       60.4626, a2: -34.1751, b2: 0.5998,
			expected: 0.2018,
			tol:      1e-3,
		},
		{
			name:     "Sharma Pair 18",
			L1:       31.2341, a1: 19.3421, b1: -24.2312,
			L2:       31.3412, a2: 19.4521, b2: -24.3412,
			expected: 0.1062,
			tol:      1e-3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CIEDE2000(tt.L1, tt.a1, tt.b1, tt.L2, tt.a2, tt.b2)
			if math.Abs(got-tt.expected) > tt.tol {
				t.Errorf("CIEDE2000() = %.4f, want %.4f (diff: %.5f)", got, tt.expected, math.Abs(got-tt.expected))
			}
		})
	}
}
