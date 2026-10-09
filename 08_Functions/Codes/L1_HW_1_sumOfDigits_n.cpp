#include <iostream>
using namespace std;

int sumOfDigits(int n) {
    int sum = 0;
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}

int main() {
    int num = 98765;
    cout << "Sum of digits of " << num << " = " << sumOfDigits(num) << endl;
    cout << "num in main is unchanged: " << num << endl;
    return 0;
}
