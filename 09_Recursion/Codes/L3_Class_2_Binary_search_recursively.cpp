#include <iostream>
using namespace std;

int binarySearch(int arr[], int low, int high, int target) {
    if (low > high) return -1;                   // range is empty: not found
    int mid = low + (high - low) / 2;
    cout << "  looking at index " << mid << " (value " << arr[mid] << ")" << endl;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) return binarySearch(arr, mid + 1, high, target);  // go right
    return binarySearch(arr, low, mid - 1, target);                          // go left
}

int main() {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int n = 10;

    cout << "Searching for 23:" << endl;
    int pos = binarySearch(arr, 0, n - 1, 23);
    cout << "Found at index " << pos << endl;

    cout << "Searching for 7:" << endl;
    pos = binarySearch(arr, 0, n - 1, 7);
    cout << "Result: " << pos << " (not found)" << endl;
    return 0;
}
