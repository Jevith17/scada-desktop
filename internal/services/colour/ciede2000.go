package colour

import (
	"math"
)

func degToRad(deg float64) float64 {
	return deg * math.Pi / 180.0
}

func radToDeg(rad float64) float64 {
	return rad * 180.0 / math.Pi
}

// CIEDE2000 computes the color difference Delta E 00 between two CIE L*a*b* coordinates
// as published by Sharma, Wu, and Dalal (Color Research & Application, 30(1), 2005).
func CIEDE2000(L1, a1, b1, L2, a2, b2 float64) float64 {
	const (
		kL = 1.0
		kC = 1.0
		kH = 1.0
	)

	// Step 1: Calculate C1, C2, and average C
	c1 := math.Sqrt(a1*a1 + b1*b1)
	c2 := math.Sqrt(a2*a2 + b2*b2)
	cBar := (c1 + c2) / 2.0

	// Step 2: G factor and adjusted a'
	cBar7 := math.Pow(cBar, 7)
	g := 0.5 * (1.0 - math.Sqrt(cBar7/(cBar7+math.Pow(25.0, 7))))

	a1Prime := (1.0 + g) * a1
	a2Prime := (1.0 + g) * a2

	c1Prime := math.Sqrt(a1Prime*a1Prime + b1*b1)
	c2Prime := math.Sqrt(a2Prime*a2Prime + b2*b2)

	// Step 3: Calculate hue angles h'1, h'2 in degrees [0, 360)
	h1Prime := radToDeg(math.Atan2(b1, a1Prime))
	if h1Prime < 0 {
		h1Prime += 360.0
	}

	h2Prime := radToDeg(math.Atan2(b2, a2Prime))
	if h2Prime < 0 {
		h2Prime += 360.0
	}

	// Step 4: Calculate Delta L', Delta C', Delta h'
	deltaLPrime := L2 - L1
	deltaCPrime := c2Prime - c1Prime

	var deltaHPrime float64
	if c1Prime*c2Prime == 0 {
		deltaHPrime = 0.0
	} else if math.Abs(h1Prime-h2Prime) <= 180.0 {
		deltaHPrime = h2Prime - h1Prime
	} else if h2Prime-h1Prime > 180.0 {
		deltaHPrime = (h2Prime - h1Prime) - 360.0
	} else {
		deltaHPrime = (h2Prime - h1Prime) + 360.0
	}

	deltaBigHPrime := 2.0 * math.Sqrt(c1Prime*c2Prime) * math.Sin(degToRad(deltaHPrime/2.0))

	// Step 5: Calculate average L', average C', average h'
	lBarPrime := (L1 + L2) / 2.0
	cBarPrime := (c1Prime + c2Prime) / 2.0

	var hBarPrime float64
	if c1Prime*c2Prime == 0 {
		hBarPrime = h1Prime + h2Prime
	} else if math.Abs(h1Prime-h2Prime) <= 180.0 {
		hBarPrime = (h1Prime + h2Prime) / 2.0
	} else if h1Prime+h2Prime < 360.0 {
		hBarPrime = (h1Prime + h2Prime + 360.0) / 2.0
	} else {
		hBarPrime = (h1Prime + h2Prime - 360.0) / 2.0
	}

	// Step 6: Calculate T
	t := 1.0 - 0.17*math.Cos(degToRad(hBarPrime-30.0)) +
		0.24*math.Cos(degToRad(2.0*hBarPrime)) +
		0.32*math.Cos(degToRad(3.0*hBarPrime+6.0)) -
		0.20*math.Cos(degToRad(4.0*hBarPrime-63.0))

	// Step 7: Calculate Delta theta, RC, RT
	deltaTheta := 30.0 * math.Exp(-math.Pow((hBarPrime-275.0)/25.0, 2))
	cBarPrime7 := math.Pow(cBarPrime, 7)
	rc := 2.0 * math.Sqrt(cBarPrime7/(cBarPrime7+math.Pow(25.0, 7)))
	rt := -math.Sin(degToRad(2.0*deltaTheta)) * rc

	// Step 8: Calculate SL, SC, SH
	lDiff50Sq := math.Pow(lBarPrime-50.0, 2)
	sl := 1.0 + (0.015*lDiff50Sq)/math.Sqrt(20.0+lDiff50Sq)
	sc := 1.0 + 0.045*cBarPrime
	sh := 1.0 + 0.015*cBarPrime*t

	// Step 9: Compute CIEDE2000 Delta E00
	termL := deltaLPrime / (kL * sl)
	termC := deltaCPrime / (kC * sc)
	termH := deltaBigHPrime / (kH * sh)

	de00Sq := termL*termL + termC*termC + termH*termH + rt*termC*termH
	if de00Sq < 0 {
		return 0.0
	}
	return math.Sqrt(de00Sq)
}
