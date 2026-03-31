package utils

import "sort"

func Percentile(data []float64, p float64) float64 {
	if len(data) == 0 {
		return 0
	}
	sort.Float64s(data)

	index := int((p / 100.0) * float64(len(data)-1))
	if index >= len(data) {
		index = len(data) - 1
	}
	return data[index]
}

func Clamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func Average(data []float64) float64 {
	if len(data) == 0 {
		return 0
	}
	var sum float64
	for _, v := range data {
		sum += v
	}
	return sum / float64(len(data))
}

func Min(data []float64) float64 {
	if len(data) == 0 {
		return 0
	}
	m := data[0]
	for _, v := range data[1:] {
		if v < m {
			m = v
		}
	}
	return m
}

func Max(data []float64) float64 {
	if len(data) == 0 {
		return 0
	}
	m := data[0]
	for _, v := range data[1:] {
		if v > m {
			m = v
		}
	}
	return m
}
