#include <iostream>
using namespace std;

int countDigits(int n) {
    if (n == 0) return 1;
    int count = 0;
    while (n > 0) {
        count++;
        n /= 10;
    }
    return count;
}

int power(int base, int exp) {
    int result = 1;
    for (int i = 1; i <= exp; i++) result *= base;
    return result;
}

bool isArmstrong(int n) {
    int digits = countDigits(n);
    int sum = 0, temp = n;
    while (temp > 0) {
        sum += power(temp % 10, digits);
        temp /= 10;
    }
    return sum == n;
}

int largestDigit(int n) {
    int largest = 0;
    while (n > 0) {
        if (n % 10 > largest) largest = n % 10;
        n /= 10;
    }
    return largest;
}

int main() {
    int nums[3] = {153, 9474, 123};
    for (int i = 0; i < 3; i++) {
        cout << nums[i] << (isArmstrong(nums[i]) ? " is" : " is not") << " an Armstrong number" << endl;
    }
    cout << "Largest digit of 58372 = " << largestDigit(58372) << endl;
    return 0;
}
