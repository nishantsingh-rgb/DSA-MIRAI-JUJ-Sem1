#include <iostream>
using namespace std;

bool isSorted(int arr[], int n) {
    if (n <= 1) return true;                 // 0 or 1 element is always sorted
    if (arr[n - 2] > arr[n - 1]) return false;  // last pair out of order
    return isSorted(arr, n - 1);             // check the first n-1 elements
}

int main() {
    int a[] = {1, 3, 5, 7, 9};
    int b[] = {1, 4, 2, 8};
    cout << "{1, 3, 5, 7, 9} is " << (isSorted(a, 5) ? "sorted" : "not sorted") << endl;
    cout << "{1, 4, 2, 8} is " << (isSorted(b, 4) ? "sorted" : "not sorted") << endl;
    return 0;
}
