#include <iostream>
using namespace std;

int main() {
    int a[5] = {1, 2, 3, 4, 5};
    int n = 5;

    // O(N) space: copy into a new array backwards
    int b[5];
    for (int i = 0; i < n; i++) {
        b[i] = a[n - 1 - i];
    }
    cout << "Copy reversed:     ";
    for (int i = 0; i < n; i++) cout << b[i] << " ";
    cout << endl;

    // O(1) space: swap the two ends and move inwards
    int left = 0, right = n - 1;
    while (left < right) {
        int temp = a[left];
        a[left] = a[right];
        a[right] = temp;
        left++;
        right--;
    }
    cout << "In-place reversed: ";
    for (int i = 0; i < n; i++) cout << a[i] << " ";
    cout << endl;
    return 0;
}
