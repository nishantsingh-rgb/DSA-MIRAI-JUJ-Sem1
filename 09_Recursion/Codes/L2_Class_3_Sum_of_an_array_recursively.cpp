#include <iostream>
using namespace std;

int sumArray(int arr[], int n) {
    if (n == 0) return 0;                        // empty array
    return arr[n - 1] + sumArray(arr, n - 1);    // last element + sum of the rest
}

int main() {
    int arr[] = {3, 8, 1, 9, 4};
    int n = 5;
    cout << "Array: ";
    for (int i = 0; i < n; i++) cout << arr[i] << " ";
    cout << endl;
    cout << "Sum = " << sumArray(arr, n) << endl;
    return 0;
}
