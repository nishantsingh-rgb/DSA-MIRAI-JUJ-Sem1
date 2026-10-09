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
    int nums[3] = {472, 9999, 1005};
    for (int i = 0; i < 3; i++) {
        cout << "Sum of digits of " << nums[i] << " = " << sumOfDigits(nums[i]) << endl;
    }
    return 0;
}
