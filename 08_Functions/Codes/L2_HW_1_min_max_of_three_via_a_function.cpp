#include <iostream>
using namespace std;

int maxOfTwo(int a, int b) {
    return (a > b) ? a : b;
}

int minOfTwo(int a, int b) {
    return (a < b) ? a : b;
}

int maxOfThree(int a, int b, int c) {
    return maxOfTwo(maxOfTwo(a, b), c);
}

int minOfThree(int a, int b, int c) {
    return minOfTwo(minOfTwo(a, b), c);
}

int main() {
    int x = 23, y = 71, z = 48;
    cout << "Numbers: " << x << ", " << y << ", " << z << endl;
    cout << "Max = " << maxOfThree(x, y, z) << endl;
    cout << "Min = " << minOfThree(x, y, z) << endl;
    return 0;
}
